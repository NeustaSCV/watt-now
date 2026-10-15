// Le rythme de l'arbre de progression (décision Q5) et du niveau 1 (plan 0.8, chantier 14), rejoué par le simulateur,
// en Markdown.
// Plan 0.10 (chantier M) : puis le niveau 2, sur la côte (les quatre lieux, les péages, la nuit du phare, les roulements,
// le budget des matières et de l'énergie) ; il rend 1 aussi si une cible du niveau 2 n'est pas tenue.
// Usage : npm run rythme [-- --detail] [-- --vite]
//   --detail : la chronologie complète de chaque parcours ; --vite : sans les chiffres à vérifier (la sensibilité).
// Il joue les parcours types (prudent, pressé, sans tutoriel, malchanceux ; chacune des trois familles) avec les sorties,
// les portes et le budget de bois et de pierre, puis les serveurs à trois et à cinq. Il rend 1 si une cible décidée
// n'est pas tenue (la cible Q5, la première sortie, les sorties sans porte, les allers-retours de ravitaillement) ou si
// un parcours bloque ; le temps de tout le niveau 1 (critère 6) est dit, sans faire échouer.

import {
  CIBLE,
  CIBLE_NIVEAU_2,
  DUREES_SORTIES_N2,
  HORIZON_NIVEAU_2_MIN,
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
  BUCHES_CORNICHE_EN_DECA,
  budgetNiveau2,
  ecartsAuNiveau2,
  jouerParcoursN2,
  pireMalchanceN2,
  sensibiliteN2,
  simulerServeurN2,
  tousLesParcoursN2,
  wottsDePeage,
  type ResultatNiveau2,
  type LigneBudget,
  type Profil,
  type ResultatParcours,
  type ScenarioBudget,
} from "../commun/src/rythme.ts";
import { nomDevoile } from "../commun/src/progression.ts";
import { SAC_LIBRE_KG, budgetEnergie, bilanNiveau2, demandeNiveau2, offreDeLaCote, poidsDesCles, rendementParFouille } from "../commun/src/rythme-niveau2.ts";
import { OBJETS, type TypeObjet } from "../commun/src/objets.ts";
import type { Famille } from "../commun/src/regles.ts";

const detail = process.argv.includes("--detail");
const vite = process.argv.includes("--vite");
const nombre = (x: number) => (Math.round(x * 10) / 10).toString().replace(".", ",");
const min = (x: number | null | undefined) => (x === null || x === undefined ? "—" : `${Math.round(x)} min`);
const NOMS_FAMILLES = { charbonniers: "🔥 Charbonniers", voltaiques: "⚡ Voltaïques", mecanistes: "⚙️ Mécanistes" } as const;
const FAMILLES: readonly Famille[] = ["voltaiques", "mecanistes", "charbonniers"];
const NOMS_LIEUX: Record<string, string> = {
  station: "la station",
  gue: "le gué",
  cooperative: "la Coopérative",
  moulin: "le Moulin",
  comptoir: "le Comptoir",
  route_pont: "la route du pont",
  grand_hotel: "le Grand Hôtel",
  corniche: "la corniche",
  phare: "le phare",
};

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
sortie.push("", "### D'où viennent les bûches et les pierres (le prudent, seul)", "", "| Famille | Bûches : terrain | tas de bois | vrac (station, gué) | Moulin, Coopérative | Comptoir | Pierres : terrain | banc de galets | vrac (gué, station, Moulin, Coopérative) |", "|---|---|---|---|---|---|---|---|---|");
for (const l of seul) {
  const v = l.venu;
  sortie.push(`| ${NOMS_FAMILLES[l.famille]} | ${v.terrain?.buche ?? 0} | ${v.tas_bois?.buche ?? 0} | ${(v.station?.buche ?? 0) + (v.gue?.buche ?? 0)} | ${(v.moulin?.buche ?? 0) + (v.cooperative?.buche ?? 0)} | ${v.comptoir?.buche ?? 0} | ${v.terrain?.pierre ?? 0} | ${v.banc_galets?.pierre ?? 0} | ${(v.gue?.pierre ?? 0) + (v.station?.pierre ?? 0) + (v.moulin?.pierre ?? 0) + (v.cooperative?.pierre ?? 0)} |`);
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

// ---------- 5. Le niveau 2 (plan 0.10, chantier M) ----------

const n2 = tousLesParcoursN2();
const malchanceN2 = FAMILLES.map((f) => pireMalchanceN2(f));
const deuxChiffres = (x: number) => (Math.round(x * 100) / 100).toString().replace(".", ",");
sortie.push(
  "",
  "# Le rythme du niveau 2 (plan 0.10, chantier M)",
  "",
  "## Le tableau du rythme",
  "",
  `Après la première soirée (${HORIZON_MIN} min), le joueur passe les portes du niveau 2 l'une après l'autre (le carnet les nomme) : le lieu de sa route d'abord (le prudent : l'hôtel par la route du pont ; le pressé : le phare par la corniche), ses évolutions communes et son meuble de famille, puis l'autre lieu, puis les meubles nouveaux (le cuiseur, les bacs de tri, les étagères : V1-04) et le métier (les armes ★★★ ; ⚙️ le cranequin léger, la charrette, le moulin de jerricans, l'arbalète de garde ; ⚡ le pack soudé, la batterie de cellules, la rampe de LED ; 🔥 le creuset). Les sorties : l'hôtel ${DUREES_SORTIES_N2.grand_hotel} min (le check-in), le phare ${DUREES_SORTIES_N2.phare} min (dont la préparation, ${DUREES_SORTIES_N2.preparerPhare} min, et le cargo, ${DUREES_SORTIES_N2.cargo} min), la halte traversée en passant, au pas du joueur. **Le péage** (12 wotts d'objets) se paie à l'aller, une fois par voyage ; **le retour est libre** (V2-01). **Le feu du phare s'allume la nuit** (21 h – 5 h 30, le monde commençant à 6 h) : le joueur part pour arriver à la nuit tombée et fait autre chose en attendant. **Les roulements** : la machinerie de l'hôtel donne ses boîtes (trois roulements chacune, V1-01), le Comptoir en vend s'il en manque. Durée simulée : ${HORIZON_NIVEAU_2_MIN} min. Les minutes comptent depuis le début du niveau 2.`,
  "",
  "| Parcours | Famille | Route du pont (H2A) | Hôtel (L2A) | Corniche (H2B) | Phare (L2B) | Sorties | Péages | Ravitaillements | Boîtes de roulements | Le phare attendu (la nuit) | Écart max entre buts | Tout le niveau 2 |",
  "|---|---|---|---|---|---|---|---|---|---|---|---|---|",
);
const ligneN2 = (r: ResultatNiveau2, nom = PROFILS[r.profil].nom) => {
  const ravit = r.ravitaillements.map((x) => `${x.motif === "ravitaillement" ? "bois" : x.motif} (${NOMS_LIEUX[x.lieu] ?? x.lieu})`).join(", ") || "0";
  const b = r.roulements;
  const boites = b.hotel + b.chance + b.comptoir ? `${b.hotel + b.chance + b.comptoir}${b.comptoir ? ` (dont ${b.comptoir} au Comptoir, ${r.achats} wotts)` : ""}, ${b.reste} roulements de reste` : "—";
  return `| ${nom} | ${NOMS_FAMILLES[r.famille]} | ${min(r.atteint.H2A)} | ${min(r.atteint.L2A)} | ${min(r.atteint.H2B)} | ${min(r.atteint.L2B)} | ${r.sorties.length} | ${r.peages.length} (${wottsDePeage(r)} wotts) | ${ravit} | ${boites} | ${r.attentesNuit.map((m) => min(m)).join(", ") || "—"} | ${min(r.ecartButs)} | ${min(r.tout)} |`;
};
for (const p of ["prudent", "presse"] as Profil[]) for (const r of n2.filter((x) => x.profil === p)) sortie.push(ligneN2(r));
for (const r of malchanceN2) sortie.push(ligneN2(r, "Le joueur malchanceux (pire de 10)"));
for (const r of n2.filter((x) => x.profil === "sans_tuto")) sortie.push(ligneN2(r));
const mecaSeul = jouerParcoursN2("prudent", "mecanistes", { seulementFamille: true }).niveau2;
sortie.push(
  "",
  "« Le phare attendu » : depuis quand le joueur voulait y aller (le feu attend la nuit) ; il a fait autre chose entre-temps (l'hôtel, ses meubles). L'écart entre buts : le niveau 2 n'a pas encore de quêtes ; les buts sont les portes nommées, les lieux atteints et les objets-clés trouvés (« Tu y penses »).",
  "",
  `**Critère 8 (le Mécaniste seul)** : son meuble de famille et tout son métier ${mecaSeul.tout !== null && mecaSeul.atteint.L2B === undefined ? `en ${min(mecaSeul.tout)}, **sans aller au phare**` : "**ne se font pas sans le phare**"} (l'hôtel à ${min(mecaSeul.atteint.L2A)}, ${mecaSeul.roulements.hotel + mecaSeul.roulements.comptoir} boîtes de roulements, ${mecaSeul.sorties.length} sortie${mecaSeul.sorties.length > 1 ? "s" : ""}).`,
);

// Le bois et la pierre
sortie.push("", "## Le budget de bois, de pierre et de glaise du niveau 2", "", "### Ce que coûte tout le niveau 2 (le prudent, seul), et d'où viennent les bûches", "");
const seulN2 = budgetNiveau2("seul");
sortie.push("| Famille | Bûches | Pierres | Glaise | Charbon | Bûches : pin tombé | vrac de la corniche | vrac du pont | tas de bois de la station | vrac de la station | terrain | Pierres : vrac du pont | banc de galets, vrac du gué |", "|---|---|---|---|---|---|---|---|---|---|---|---|---|");
for (const l of seulN2) {
  const v = l.venu;
  sortie.push(`| ${NOMS_FAMILLES[l.famille]} | ${l.depense.buche ?? 0} | ${l.depense.pierre ?? 0} | ${l.depense.glaise ?? 0} | ${l.depense.charbon_bois ?? 0} | ${v.pin_tombe?.buche ?? 0} | ${v.corniche?.buche ?? 0} | ${v.route_pont?.buche ?? 0} | ${v.tas_bois?.buche ?? 0} | ${v.station?.buche ?? 0} | ${v.terrain?.buche ?? 0} | ${v.route_pont?.pierre ?? 0} | ${(v.banc_galets?.pierre ?? 0) + (v.gue?.pierre ?? 0)} |`);
}
const scenariosN2 = [["seul", "Seul"], ["malchanceux", "Malchanceux (pire de 10)"], ["cinq_en_file", "À cinq, en file"]] as const;
const budgetsN2 = new Map(scenariosN2.map(([sc]) => [sc, sc === "seul" ? seulN2 : budgetNiveau2(sc)]));
sortie.push(
  "",
  "### Les allers-retours de ravitaillement du niveau 2, en plus des sorties à l'hôtel et au phare",
  "",
  `Tous (le bois, les pierres, la glaise) / dont le bois. Cible : ${CIBLE_NIVEAU_2.ravitaillementsMax} au plus (« confortable », notice §3.i) ; le bois des 🔥, ${CIBLE_NIVEAU_2.boisCharbonniersMax} au plus (N2-29 : « 2 à 3 allers-retours de bois »). Le ravitaillement de bois va là où il y en a le plus pour soi : la station (son tas de bois, son vrac) ou la corniche (le pin tombé, et les ${BUCHES_CORNICHE_EN_DECA} bûches du vrac en deçà de la barricade : on ne paie pas).`,
  "",
  `| Famille | ${scenariosN2.map(([, nom]) => nom).join(" | ")} |`,
  `|---|${scenariosN2.map(() => "---").join("|")}|`,
);
const fautesN2: string[] = [];
for (const f of FAMILLES) {
  const cases = scenariosN2.map(([sc]) => {
    const l = budgetsN2.get(sc)!.find((x) => x.famille === f);
    if (!l) return "—";
    if (l.ravitaillements > CIBLE_NIVEAU_2.ravitaillementsMax) fautesN2.push(`${NOMS_FAMILLES[f]}, ${sc} : ${l.ravitaillements} allers-retours au niveau 2 (au plus ${CIBLE_NIVEAU_2.ravitaillementsMax})`);
    if (f === "charbonniers" && l.bois > CIBLE_NIVEAU_2.boisCharbonniersMax) fautesN2.push(`${NOMS_FAMILLES[f]}, ${sc} : ${l.bois} allers-retours de bois (au plus ${CIBLE_NIVEAU_2.boisCharbonniersMax})`);
    if (l.tout === null) fautesN2.push(`${NOMS_FAMILLES[f]}, ${sc} : pas tout le niveau 2 en ${HORIZON_NIVEAU_2_MIN} min`);
    return `${l.ravitaillements} / ${l.bois}${l.achats ? ` (${l.achats} wotts au Comptoir)` : ""}`;
  });
  sortie.push(`| ${NOMS_FAMILLES[f]} | ${cases.join(" | ")} |`);
}
const serveurN2 = simulerServeurN2(SERVEURS.cinq_en_file);
sortie.push("", `**À cinq, en file**, le vrac de bûches de la corniche n'est jamais vide plus de ${min(serveurN2.videCorniche)}, celui de la route du pont plus de ${min(serveurN2.videPont)} (30 min au plus, comme le critère 7 du niveau 1).`);
if (serveurN2.videCorniche > 30 || serveurN2.videPont > 30) fautesN2.push("à cinq : une halte du niveau 2 vide de bûches plus de 30 min");
if (!vite) {
  sortie.push(
    "",
    "### Les chiffres à vérifier (le pin tombé ; les boîtes de roulements de la machinerie)",
    "",
    "Le prudent, seul : allers-retours (tous / bois), ce que le Comptoir a vendu, tout le niveau 2.",
    "",
    `| Variante | ${FAMILLES.map((f) => NOMS_FAMILLES[f]).join(" | ")} |`,
    `|---|${FAMILLES.map(() => "---").join("|")}|`,
  );
  for (const v of sensibiliteN2()) sortie.push(`| ${v.nom} | ${FAMILLES.map((f) => { const l = v.familles[f]; return `${l.ravitaillements} / ${l.bois}${l.achats ? `, ${l.achats} wotts` : ""}, ${min(l.tout)}`; }).join(" | ")} |`);
}

// Les matières : la charge par route, l'offre, le bilan
const offre = offreDeLaCote();
const kg = (x: number) => `${nombre(x)} kg`;
sortie.push(
  "",
  "## Le budget des matières du niveau 2 (notice §3.i)",
  "",
  "### Une charge de sac par route",
  "",
  `Les matériaux des évolutions de chaque lieu, à réunir chez soi (sans les objets-clés), et les objets-clés à rapporter du lieu (les outils compris : le rabot, le fer à souder), à comparer aux ${SAC_LIBRE_KG} kg libres d'un sac à dos. Le parcours rapporte tous les objets-clés d'un lieu d'un coup : ${kg(poidsDesCles("grand_hotel"))} à l'hôtel (dont ses boîtes de roulements), ${kg(poidsDesCles("phare"))} au phare.`,
  "",
  "| Famille | Hôtel : matériaux | objets-clés | Phare : matériaux | objets-clés | Meubles nouveaux et métier (déroulés) |",
  "|---|---|---|---|---|---|",
);
for (const f of FAMILLES) {
  const d = demandeNiveau2(f);
  sortie.push(`| ${NOMS_FAMILLES[f]} | ${kg(d.kgA)} | ${kg(d.kgClesA)} | ${kg(d.kgB)} | ${kg(d.kgClesB)} | ${kg(d.kgMetier)} |`);
  for (const [quoi, x] of [["l'hôtel, matériaux", d.kgA], ["l'hôtel, objets-clés", d.kgClesA], ["le phare, matériaux", d.kgB], ["le phare, objets-clés", d.kgClesB]] as const) if (x > SAC_LIBRE_KG) fautesN2.push(`${NOMS_FAMILLES[f]} : ${quoi} ${kg(x)} (plus d'un sac à dos, ${SAC_LIBRE_KG} kg)`);
}
if (poidsDesCles("phare") > SAC_LIBRE_KG || poidsDesCles("grand_hotel") > SAC_LIBRE_KG) fautesN2.push("les objets-clés d'un lieu, pris tous d'un coup, pèsent plus d'un sac à dos");
const MATIERES_VUES: readonly TypeObjet[] = ["tube_aluminium", "rouleau_fil_fer", "poignee_clous", "bouteille_verre", "caoutchouc", "plastique", "aimant", "aluminium", "cellule_lithium", "led", "fil_cuivre", "chiffons", "buche", "pierre"];
const nomObjet = (t: TypeObjet) => OBJETS[t]?.nom ?? t;
sortie.push(
  "",
  "### Ce que rapporte une visite de chaque lieu de la côte",
  "",
  "Tout fouillé une fois (la donnée du point, et le tirage de sa table), le vrac pour un voyageur seul, le pin tombé ; chaque objet compté entier et démonté (au mieux) ; les bancs de la cale à moitié (marée basse la moitié du temps). Une moyenne sur 400 visites. La valeur : ce que le Comptoir en donnerait (le péage en demande 12).",
  "",
  `| Lieu | Points | Valeur (wotts) | ${MATIERES_VUES.map(nomObjet).join(" | ")} |`,
  `|---|---|---|${MATIERES_VUES.map(() => "---").join("|")}|`,
);
for (const o of offre.parLieu) sortie.push(`| ${NOMS_LIEUX[o.lieu]} | ${o.points} | ${o.wotts} | ${MATIERES_VUES.map((t) => deuxChiffres(o.matieres[t] ?? 0)).join(" | ")} |`);
sortie.push(
  "",
  "### Le bilan : ce que le niveau 2 demande, contre une visite de chaque lieu de la côte",
  "",
  "Les matières qu'une visite de chaque lieu ne suffit pas à donner (le bois, la pierre et la glaise : le parcours les compte, plus haut ; les objets-clés : leur lieu). « Passages » : combien de tournées de la côte il faudrait, à elle seule (le niveau 1, ses déchets et le Comptoir en donnent aussi). La source : d'où la famille l'a d'abord (le sol, une fouille, les déchets, un démontage, une fabrication).",
  "",
  "| Famille | Matière | Demande | Une tournée de la côte | Passages | Source |",
  "|---|---|---|---|---|---|",
);
for (const f of FAMILLES) {
  for (const l of bilanNiveau2(f, offre.total).filter((x) => x.passages > 1)) sortie.push(`| ${NOMS_FAMILLES[f]} | ${nomObjet(l.objet)} | ${deuxChiffres(l.demande)} | ${deuxChiffres(l.offre)} | ${Number.isFinite(l.passages) ? l.passages : "aucune"} | ${l.source ?? "—"} |`);
}
const tubes = rendementParFouille("tube_aluminium");
sortie.push("", `**Le tube d'aluminium** (N2-02 à N2-05) : par fouille, ${tubes.map((t) => `${deuxChiffres(t.parFouille)} à la table « ${t.table} »`).join(", ") || "aucune table"} ; sur la côte (V3-02), ${deuxChiffres(offre.total.tube_aluminium ?? 0)} par tournée : les transats de l'hôtel (deux chaises de camping), l'échelle du hangar du phare, la chaise du camp de la corniche, les bancs de la cale du pont (7 à marée basse : 2 caddies de 2 tubes, 2 trottinettes, la débroussailleuse). **Les bouteilles en verre** (V3-03) : ${deuxChiffres(offre.total.bouteille_verre ?? 0)} par tournée (le bar et les cuisines de l'hôtel, le vaisselier du phare, l'épicerie et le bar du pont).`);
const e = budgetEnergie();
sortie.push(
  "",
  "## L'énergie des ⚡ et des ⚙️ (le banc qui suit le soleil, compensé : V1-19 ; le moulin de jerricans : V1-03)",
  "",
  "| Par jour de jeu (24 min) | Wh |",
  "|---|---|",
  `| Le banc solaire, en moyenne sur la vraie météo | ${nombre(e.bancParJour)} |`,
  `| Le banc, un jour tout au soleil | ${nombre(e.bancParBeauJour)} |`,
  `| Le moulin de jerricans, en moyenne | ${nombre(e.moulinParJour)} |`,
  `| Le moulin, avec la poulie (+ 50 %) | ${nombre(e.moulinPoulieParJour)} |`,
  `| La rampe de LED, par nuit (3 W) | − ${nombre(e.rampeParNuit)} |`,
  "",
  `La batterie de cellules (120 Wh) se remplit en ${nombre(e.joursCellulesBanc)} jours de jeu au banc seul, ${nombre(e.joursCellulesBancMoulin)} avec le moulin ; la rampe ne prend que ${Math.round((100 * e.rampeParNuit) / e.bancParJour)} % de ce que donne le banc.`,
);
const fautesParcoursN2 = [...n2, ...malchanceN2].flatMap(ecartsAuNiveau2);
if (mecaSeul.tout === null || mecaSeul.atteint.L2B !== undefined) fautesParcoursN2.push("le Mécaniste seul n'a pas son métier sans aller au phare (critère 8)");
const blocagesN2 = [...new Set([...n2, ...malchanceN2].flatMap((r) => r.blocages))];
const toutesN2 = [...fautesParcoursN2, ...fautesN2];
sortie.push(
  "",
  "## La cible du niveau 2",
  "",
  blocagesN2.length ? `**Ce qui bloque :**\n${blocagesN2.map((b) => `- ${b}`).join("\n")}\n` : "Aucun parcours ne bloque au niveau 2.",
  "",
  toutesN2.length
    ? `**Ne tient pas :**\n${toutesN2.map((f) => `- ${f}`).join("\n")}`
    : `**Le rythme et le budget du niveau 2 tiennent** (tout le niveau 2 à l'horizon, sans blocage ; les allers-retours de ravitaillement ; le péage à l'aller seulement ; le feu du phare la nuit ; une charge de sac par route ; le Mécaniste seul sans le phare).`,
);

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

function chronologieN2(r: ResultatNiveau2): string[] {
  const lignes = [`### Niveau 2 : ${PROFILS[r.profil].nom}, ${NOMS_FAMILLES[r.famille]}`, ""];
  const faits: { minute: number; texte: string }[] = [];
  for (const s of r.sorties) {
    const rapporte = Object.entries(s.rapporte).map(([t, n]) => `${n} ${t}`).join(", ");
    faits.push({ minute: s.minute, texte: `🚶 Sortie (${s.motif}) : ${NOMS_LIEUX[s.lieu] ?? s.lieu}${s.enPassant.length ? ` (par ${s.enPassant.map((l) => NOMS_LIEUX[l] ?? l).join(", ")})` : ""}${s.cles.length ? ` ; objets-clés : ${s.cles.join(", ")}` : ""}${rapporte ? ` ; rapporte ${rapporte}` : ""}${s.porte ? "" : " — sans porte"}` });
  }
  for (const p of r.peages) faits.push({ minute: p.minute, texte: `🪙 Péage (${p.passage === "pont" ? "la chicane du pont" : "la barricade du tunnel"}) : 12 wotts` });
  for (const p of r.postesFaits) faits.push({ minute: p.minute, texte: `🔨 ${p.id}` });
  faits.sort((a, b) => a.minute - b.minute);
  for (const f of faits) lignes.push(`- **${nombre(f.minute)}** · ${f.texte}`);
  return [...lignes, ""];
}
for (const r of detail ? n2 : n2.filter((x) => x.profil === "prudent" || x.profil === "presse")) sortie.push(...chronologieN2(r));

console.log(sortie.join("\n"));
process.exitCode = toutes.length || blocages.length || toutesN2.length || blocagesN2.length ? 1 : 0;
