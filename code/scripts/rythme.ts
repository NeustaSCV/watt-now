// Le rythme de l'arbre de progression (décision Q5) et du niveau 1 (plan 0.8, chantier 14), rejoué par le simulateur,
// en Markdown.
// Usage : npm run rythme [-- --detail] [-- --vite]
//   --detail : la chronologie complète de chaque parcours ; --vite : sans les chiffres à vérifier (la sensibilité).
// Il joue les parcours types (prudent, pressé, sans tutoriel, malchanceux ; chacune des trois familles) avec les sorties,
// les portes et le budget de bois et de pierre, puis les serveurs à trois et à cinq. Il rend 1 si une cible décidée
// n'est pas tenue (la cible Q5, la première sortie, les sorties sans porte, les allers-retours de ravitaillement) ou si
// un parcours bloque ; le temps de tout le niveau 1 (critère 6) est dit, sans faire échouer.

import {
  CIBLE,
  HORIZON_MIN,
  HYPOTHESES_DECIDEES,
  PROFILS,
  RAVITAILLEMENTS_MAX,
  SERVEURS,
  budgetNiveau1,
  ecartsALaCible,
  ecartsAuNiveau1,
  jouerParcours,
  pireMalchance,
  sensibilite,
  simulerServeur,
  tempsDuNiveau1,
  tousLesParcours,
  type LigneBudget,
  type Profil,
  type ResultatParcours,
  type ScenarioBudget,
} from "../commun/src/rythme.ts";
import { nomDevoile } from "../commun/src/progression.ts";
import type { Famille } from "../commun/src/regles.ts";

const detail = process.argv.includes("--detail");
const vite = process.argv.includes("--vite");
const nombre = (x: number) => (Math.round(x * 10) / 10).toString().replace(".", ",");
const min = (x: number | null | undefined) => (x === null || x === undefined ? "—" : `${Math.round(x)} min`);
const NOMS_FAMILLES = { charbonniers: "🔥 Charbonniers", voltaiques: "⚡ Voltaïques", mecanistes: "⚙️ Mécanistes" } as const;
const FAMILLES: readonly Famille[] = ["voltaiques", "mecanistes", "charbonniers"];
const NOMS_LIEUX: Record<string, string> = { station: "la station", gue: "le gué", cooperative: "la Coopérative", moulin: "le Moulin", comptoir: "le Comptoir" };

const parcours = tousLesParcours();
const malchance = FAMILLES.map((f) => pireMalchance(f));
const sortie: string[] = ["# Le rythme du niveau 1 (plan 0.8, chantier 14 ; décision Q5)", ""];

// ---------- 1. Le tableau du rythme ----------

sortie.push(
  "## Le tableau du rythme",
  "",
  `Le joueur suit le parcours (§1.1 du plan) : le carnet nomme la porte suivante et il la passe d'abord (« S'installer » en portes successives, §2.6 ; les quêtes du chantier 13 sont simulées par cette ligne des portes), les autres quêtes du carnet entre-temps. Les sorties ont leur durée (station 12 min, gué 12, Coopérative 30, Moulin 30, au pas d'un joueur moyen). Le malchanceux : le pire de 20 tirages, le vrac des haltes toujours vidé avant lui, jamais de clé rare. Durée simulée : ${HORIZON_MIN} min.`,
  "",
  "| Parcours | Famille | Première sortie | Station (H1A) | Gué (H1B) | Coopérative (L1A) | Moulin (L1B) | Écart max entre portes | Sorties sans porte (3 h) | Dernière porte à clé | Tout le niveau 1 | Ravitaillements |",
  "|---|---|---|---|---|---|---|---|---|---|---|---|",
);
const ligneRythme = (r: ResultatParcours, nom = PROFILS[r.profil].nom) => {
  const m = r.mesures;
  const comptoir = m.sorties3h - m.sortiesButin3h;
  return `| ${nom} | ${NOMS_FAMILLES[r.famille]} | ${min(m.premiereSortie)} | ${min(r.atteint.H1A)} | ${min(r.atteint.H1B)} | ${min(r.atteint.L1A)} | ${min(r.atteint.L1B)} | ${min(m.ecartPortes)} | ${m.sansPorteButin3h} sur ${m.sortiesButin3h}${comptoir ? ` (+ ${comptoir} au Comptoir)` : ""} | ${min(m.dernierePorte)} | ${min(m.niveau1)} | ${m.ravitaillements} |`;
};
for (const p of ["prudent", "presse"] as Profil[]) for (const r of parcours.filter((x) => x.profil === p)) sortie.push(ligneRythme(r));
for (const r of malchance) sortie.push(ligneRythme(r, "Le joueur malchanceux (pire de 20)"));
for (const r of parcours.filter((x) => x.profil === "sans_tuto")) sortie.push(ligneRythme(r));
sortie.push(
  "",
  `Le parcours visé (§1.1) : la station de 25 à 50 min, le gué de 50 à 80, la première L1 de 80 à 140, la seconde de 140 à 200 ; tout le niveau 1 en ≈ 3 h 20 pour le prudent (critère 6). Les sorties « au Comptoir » (vendre, déposer, acheter) ne cherchent pas de porte : elles sont comptées à part.`,
);
const temps = parcours.map(tempsDuNiveau1).filter((t) => t !== null);
sortie.push(
  "",
  `**Critère 6 (le temps, cible ≈ ${CIBLE.niveau1Prudent} min pour le prudent, à 10 % près)** : les portes à clé ${temps.every((t) => t.portesTiennent) ? "tiennent" : "ne tiennent pas"} (${temps.map((t) => min(t.portes)).join(", ")}) ; tout le niveau 1, avec le reste de la maison et du métier, ${temps.every((t) => t.toutTient) ? "tient" : "ne tient pas"} (${temps.map((t) => min(t.tout)).join(", ")}).`,
);

// ---------- 2. Le budget ----------

sortie.push("", "## Le budget de pierre et de bois (§2.7)", "");
const seul = budgetNiveau1("seul");
sortie.push("### Ce que coûte tout le niveau 1 (le prudent, seul)", "", "| Famille | Bûches | Pierres | Branches | Glaise | Meules de charbonnière | Attente des branches | Feu à court de branches |", "|---|---|---|---|---|---|---|---|");
for (const l of seul) {
  const r = parcours.find((x) => x.profil === "prudent" && x.famille === l.famille)!;
  sortie.push(`| ${NOMS_FAMILLES[l.famille]} | ${l.depense.buche ?? 0} | ${l.depense.pierre ?? 0} | ${l.depense.branche ?? 0} | ${l.depense.glaise ?? 0} | ${r.budget.meules}${r.budget.charbonnette ? ` (dont ${r.budget.charbonnette} en charbonnette)` : ""} | ${min(l.attenteBranches)} | ${min(l.feuACourt)} |`);
}
sortie.push("", "### D'où viennent les bûches et les pierres (le prudent, seul)", "", "| Famille | Bûches : terrain | tas de bois | vrac de la station | Moulin | Comptoir | Pierres : terrain | banc de galets | vrac (gué, station) |", "|---|---|---|---|---|---|---|---|---|");
for (const l of seul) {
  const v = l.venu;
  sortie.push(`| ${NOMS_FAMILLES[l.famille]} | ${v.terrain?.buche ?? 0} | ${v.tas_bois?.buche ?? 0} | ${v.station?.buche ?? 0} | ${v.moulin?.buche ?? 0} | ${v.comptoir?.buche ?? 0} | ${v.terrain?.pierre ?? 0} | ${v.banc_galets?.pierre ?? 0} | ${(v.gue?.pierre ?? 0) + (v.station?.pierre ?? 0)} |`);
}
const scenarios: [ScenarioBudget, string][] = [
  ["seul", "Seul"],
  ["malchanceux", "Malchanceux"],
  ["trois", "À trois"],
  ["cinq_en_file", "À cinq, en file"],
  ["cinq_ensemble", "À cinq, ensemble"],
];
const budgets = new Map<ScenarioBudget, LigneBudget[]>(scenarios.map(([s]) => [s, s === "seul" ? seul : budgetNiveau1(s)]));
sortie.push(
  "",
  "### Les allers-retours de ravitaillement à la station, en plus de la visite du tutoriel",
  "",
  "Entre parenthèses : les bûches achetées au Comptoir (B13) quand la station n'en avait plus.",
  "",
  `| Famille | Décidé | ${scenarios.map(([, n]) => n).join(" | ")} |`,
  `|---|---|${scenarios.map(() => "---").join("|")}|`,
);
const fautesBudget: string[] = [];
for (const f of FAMILLES) {
  const cases = scenarios.map(([s]) => {
    const l = budgets.get(s)!.find((x) => x.famille === f);
    if (!l) return "—";
    if (l.ravitaillements > RAVITAILLEMENTS_MAX[f]) fautesBudget.push(`${NOMS_FAMILLES[f]}, ${s} : ${l.ravitaillements} allers-retours (au plus ${RAVITAILLEMENTS_MAX[f]})`);
    return `${l.ravitaillements}${l.achats ? ` (${l.achats})` : ""}`;
  });
  sortie.push(`| ${NOMS_FAMILLES[f]} | ${f === "voltaiques" ? "0" : f === "mecanistes" ? "0 à 1" : "1"} | ${cases.join(" | ")} |`);
}
sortie.push("", "### Les haltes à plusieurs (critère 7)", "", "| Serveur | Station sans bûches en vrac, au plus | Gué sans pierres en vrac, au plus |", "|---|---|---|");
for (const nom of Object.keys(SERVEURS) as (keyof typeof SERVEURS)[]) {
  const s = simulerServeur(SERVEURS[nom]);
  sortie.push(`| ${nom.replaceAll("_", " ")} | ${nombre(s.videStation)} min | ${nombre(s.videGue)} min |`);
  if (s.videStation > 30 || s.videGue > 30) fautesBudget.push(`${nom} : une halte vide plus de 30 min`);
}
if (!vite) {
  sortie.push(
    "",
    "### Les chiffres à vérifier (§2.7 : le tas de 10 bûches, son retour en 6 h, le stock du Comptoir)",
    "",
    "Allers-retours de ravitaillement, seul / à cinq en file (bûches achetées au Comptoir).",
    "",
    `| Variante | ${FAMILLES.map((f) => NOMS_FAMILLES[f]).join(" | ")} |`,
    `|---|${FAMILLES.map(() => "---").join("|")}|`,
  );
  for (const l of sensibilite()) sortie.push(`| ${l.nom} | ${FAMILLES.map((f) => `${l.familles[f].seul} / ${l.familles[f].cinq}${l.familles[f].achats ? ` (${l.familles[f].achats})` : ""}`).join(" | ")} |`);
  sortie.push("", `Hypothèses décidées : tas de bois ${HYPOTHESES_DECIDEES.tasBois} bûches (${nombre(HYPOTHESES_DECIDEES.retourTasMin / 60)} h), banc de galets ${HYPOTHESES_DECIDEES.bancGalets} pierres, vrac de la station ${HYPOTHESES_DECIDEES.vracStation.buche} bûches et ${HYPOTHESES_DECIDEES.vracStation.pierre} pierres, du gué ${HYPOTHESES_DECIDEES.vracGue} pierres (retour ${HYPOTHESES_DECIDEES.retourVracMin} min), poutres du Moulin ${HYPOTHESES_DECIDEES.poutresMoulin} bûches, Comptoir ${HYPOTHESES_DECIDEES.stockComptoir} (une toutes les ${nombre(HYPOTHESES_DECIDEES.reassortMin / 60)} h).`);
}

// ---------- 3. Avec le carnet de la 0.7 ----------

sortie.push(
  "",
  "## Avec le carnet de la 0.7 (les portes alternées avec la ligne « S'installer » actuelle)",
  "",
  "Ce que donnerait le niveau 1 si le carnet ne nommait pas les portes : la ligne des portes n'est qu'une ligne de plus, à son tour.",
  "",
  "| Parcours | Famille | Première sortie | Station (H1A) | Gué (H1B) | Coopérative (L1A) | Moulin (L1B) | Écart max entre portes | Sorties sans porte (3 h) | Dernière porte à clé | Tout le niveau 1 | Ravitaillements |",
  "|---|---|---|---|---|---|---|---|---|---|---|---|",
);
for (const p of ["prudent", "presse"] as Profil[]) for (const f of FAMILLES) sortie.push(ligneRythme(jouerParcours(p, f, { portes: "alternees" })));

// ---------- 4. La cible Q5 ----------

sortie.push(
  "",
  "## La cible Q5 (la première soirée)",
  "",
  `Cible : dans les ${CIBLE.debutMin} premières minutes, **${CIBLE.nouveautesDebutMin} nouveautés** au moins (recette dévoilée ou but nouveau : une toutes les 3 min en moyenne) et jamais **${CIBLE.trouDebutMax} min** sans rien ; puis un but nouveau (une quête, une porte nommée, un lieu atteint, une idée au ramassage) au moins toutes les **${CIBLE.ecartButsMax} min** jusqu'à la fin des trois premières heures. Au pas du joueur : le prudent (×${String(PROFILS.prudent.facteur).replace(".", ",")}) a d'autant plus de marge ; le vétéran qui saute le tutoriel n'a que la cible des buts.`,
  "",
  "| Parcours | Famille | Nouveautés (30 min) | Écart max (30 min) | Recettes (30 min) | Écart max entre recettes (30 min) | Écart max entre buts (3 h) | Écart max entre buts (tout) | Dernier but | Quêtes finies | Recettes en tout |",
  "|---|---|---|---|---|---|---|---|---|---|---|",
);
for (const r of parcours) {
  const m = r.mesures;
  sortie.push(
    `| ${PROFILS[r.profil].nom} | ${NOMS_FAMILLES[r.famille]} | ${m.nouveautesDebut} | ${nombre(m.ecartNouveautesDebut)} min | ${m.recettesDebut} | ${nombre(m.ecartRecettesDebut)} min | ${nombre(m.ecartButsEnsuite)} min | ${nombre(m.ecartButsTout)} min | ${nombre(m.dernierBut)} min | ${m.quetesFinies} | ${m.recettes} |`,
  );
}

// ---------- Ce qui bloque, la cible ----------

const fautes = [...parcours, ...malchance].flatMap((r) => [...ecartsALaCible(r), ...ecartsAuNiveau1(r)]);
const blocages = [...new Set([...parcours, ...malchance].flatMap((r) => r.blocages))];
sortie.push("", "## Ce qui bloque", "", blocages.length ? blocages.map((b) => `- ${b}`).join("\n") : "Aucun parcours ne bloque : chaque recette demandée est dévoilée à temps, chaque ingrédient se trouve, chaque porte se passe.");
const attentes = parcours.flatMap((r) => Object.entries(r.attentes).map(([q, m]) => `- ${PROFILS[r.profil].nom}, ${r.famille} : « ${q.replace("porte:", "la porte ")} » a attendu ${nombre(m)} min`));
if (attentes.length) sortie.push("", "Attentes d'un dévoilement (la porte suivante n'est pas encore pensée : on fait autre chose entre-temps) :", ...attentes);
const toutes = [...fautes, ...fautesBudget];
sortie.push("", "## La cible", "", toutes.length ? `**Ne tient pas :**\n${toutes.map((f) => `- ${f}`).join("\n")}` : "**Le rythme et le budget tiennent** (la cible Q5, la première sortie, les sorties sans porte, les allers-retours de ravitaillement, les haltes jamais vides plus de 30 min).");

// ---------- Les chronologies ----------

function chronologie(r: ResultatParcours): string[] {
  const lignes = [`### ${PROFILS[r.profil].nom}, ${NOMS_FAMILLES[r.famille]}`, ""];
  const faits: { minute: number; texte: string }[] = [];
  for (const e of r.evenements) {
    if (!detail && e.minute > CIBLE.debutMin && e.genre === "recette") continue;
    faits.push({ minute: e.minute, texte: e.genre === "recette" ? `💡 ${e.quoi.map(nomDevoile).join(", ")}` : `📓 ${e.quoi.join(", ")}` });
  }
  for (const s of r.sorties) {
    const rapporte = Object.entries(s.rapporte).map(([t, n]) => `${n} ${t}`).join(", ");
    faits.push({ minute: s.minute, texte: `🚶 Sortie (${s.motif}) : ${NOMS_LIEUX[s.lieu] ?? s.lieu}${s.enPassant.length ? ` (par ${s.enPassant.map((l) => NOMS_LIEUX[l] ?? l).join(", ")})` : ""}${s.cles.length ? ` ; clés : ${s.cles.join(", ")}` : ""}${rapporte ? ` ; rapporte ${rapporte}` : ""}${s.porte ? "" : " — sans porte"}` });
  }
  for (const p of r.portes) faits.push({ minute: p.minute, texte: `🚪 Porte franchie : ${p.id} (${p.cle})` });
  faits.sort((a, b) => a.minute - b.minute);
  for (const f of faits) lignes.push(`- **${nombre(f.minute)}** · ${f.texte}`);
  return [...lignes, ""];
}
sortie.push("", "## Les chronologies", "", detail ? "Chaque nouveauté, minute par minute." : "Les recettes de la première demi-heure, puis les buts, les sorties et les portes (`-- --detail` : tout).", "");
for (const r of parcours) sortie.push(...chronologie(r));

console.log(sortie.join("\n"));
process.exitCode = toutes.length || blocages.length ? 1 : 0;
