// 0.6, chantier 8 (Book 25 §9.5) : l'aide du jeu a ses cinq rubriques du métier ; chaque rubrique s'ouvre (elle a un
// titre, un résumé, du contenu) ; les touches citées existent ; et rien ne dit **où** est le rare.

import { test } from "node:test";
import assert from "node:assert/strict";
import { RUBRIQUES_AIDE } from "./aide-contenu.ts";
import { ACTIONS } from "./touches.ts";

/** Tout le texte d'une rubrique, à plat. */
function texte(r: (typeof RUBRIQUES_AIDE)[number]): string {
  return [r.titre, r.resume, ...r.blocs.map((b) => (typeof b === "string" ? b : "sous_titre" in b ? b.sous_titre : b.liste.join("\n")))].join("\n");
}

test("0.6 aide : les cinq rubriques du métier existent, et chacune a de quoi s'ouvrir", () => {
  const ids = RUBRIQUES_AIDE.map((r) => r.id);
  for (const id of ["tirer", "etoiles", "metier-autres", "electricite", "pieges"]) assert.ok(ids.includes(id), id);
  assert.equal(new Set(ids).size, ids.length, "des identifiants uniques");
  for (const r of RUBRIQUES_AIDE) {
    assert.match(r.id, /^[a-z]+(-[a-z]+)*$/, r.id);
    assert.ok(r.titre.length > 0 && r.titre.length <= 40, `${r.id} : titre`);
    assert.ok(r.resume.length > 0 && r.resume.length <= 110, `${r.id} : résumé de ${r.resume.length} caractères`);
    assert.ok(r.blocs.length > 0, `${r.id} : vide`);
  }
});

test("0.6 aide : les touches citées sont de vraies actions ({lancer} compris)", () => {
  for (const r of RUBRIQUES_AIDE) {
    for (const [, nom] of texte(r).matchAll(/\{(\w+)\}/g)) assert.ok(nom! in ACTIONS, `${r.id} : {${nom}}`);
  }
  assert.ok(RUBRIQUES_AIDE.some((r) => texte(r).includes("{lancer}")));
});

test("0.6 aide : comment, jamais où est le rare (l'if, la lime, le rail, les manuels, l'arc de tir sportif)", () => {
  const tout = RUBRIQUES_AIDE.map(texte).join("\n").toLowerCase();
  for (const secret of [/(^|[^a-zà-ÿ])ifs?([^a-zà-ÿ]|$)/, /lime usée/, /rail/, /directeur/, /tir sportif/, /carbone/, /bobine/, /fil dentaire/, /camionnette/]) {
    assert.ok(!secret.test(tout), `l'aide ne doit pas dire ${secret}`);
  }
});

// 0.7, chantier 6 : l'arbre de progression et les déchets de l'Abondance dans l'aide.
const rubrique = (id: string) => texte(RUBRIQUES_AIDE.find((r) => r.id === id)!);

test("0.7 aide : « Fabriquer » dit que les recettes viennent quand on y pense, et la pastille", () => {
  const t = rubrique("fabriquer");
  assert.match(t, /apparaissent quand tu y penses/);
  assert.match(t, /pastille/);
  assert.match(t, /À découvrir/);
  assert.match(rubrique("ecran"), /Fabriquer.*pastille/);
});

test("0.7 aide : « Je suis coincé » répond à la recette qui ne vient pas, et aux trouvailles invendables", () => {
  const t = rubrique("questions");
  assert.match(t, /Une recette ne vient pas/);
  assert.match(t, /deux heures/);
  assert.match(t, /refuse les ordures/);
});

test("0.7 aide : les déchets — tout se ramasse, presque rien ne vaut, les conteneurs se fouillent, le Comptoir refuse", () => {
  const t = rubrique("dechets");
  assert.match(t, /Tout ce que tu vois au sol se ramasse/);
  assert.match(t, /ordures/);
  assert.match(t, /se \*\*fouillent\*\*/);
  assert.match(t, /Comptoir les refuse/);
  assert.match(t, /sauf sur ton terrain/);
  assert.match(rubrique("wotts"), /refuse les ordures/);
  assert.match(rubrique("carnet"), /dernière idée/);
});

// Plan 0.8, chantier 13 : l'aide du niveau 1. Chaque rubrique s'ouvre (le test 0.6 ci-dessus les vérifie toutes) ; les
// nouvelles disent ce qu'elles doivent dire, sans rien dévoiler du rare.

test("0.8 aide : chaque rubrique s'ouvre, dont « Le gué », « Le Moulin » et « Faire évoluer une arme »", () => {
  const ids = RUBRIQUES_AIDE.map((r) => r.id);
  for (const id of ["fabriquer", "ameliorer", "questions", "gue", "moulin", "evoluer-arme"]) assert.ok(ids.includes(id), id);
  for (const r of RUBRIQUES_AIDE) {
    // S'ouvrir : un titre, un résumé, au moins un paragraphe de texte (pas seulement des sous-titres).
    assert.ok(r.blocs.some((b) => typeof b === "string" || "liste" in b), `${r.id} : rien à lire`);
    assert.ok([...r.icone].length <= 3, `${r.id} : une icône`);
  }
});

test("0.8 aide : « Fabriquer » — les recettes liées aux meubles, « Tu y penses », l'idée gardée ; les outils sont des portes dures", () => {
  const t = rubrique("fabriquer");
  assert.match(t, /À la main/);
  assert.match(t, /À un meuble/);
  assert.match(t, /Tu y penses/);
  assert.match(t, /gardée pour plus tard/);
  assert.match(t, /déjà en poche/);
  assert.match(t, /Il faut le niveau demandé/);
  assert.doesNotMatch(t, /plus lentement \(« outil de fortune »\)/);
});

test("0.8 aide : « Améliorer sa base » — la pièce de dehors, l'indice, le Comptoir, les outils de fortune, le râtelier", () => {
  const t = rubrique("ameliorer");
  // 0.8.2 (R9) : plus de « clé » ; la pièce de dehors. Plan 0.10 (chantier L) : plus de repli, à aucun niveau ; le
  // Comptoir la vend, à qui connaît son lieu.
  for (const m of [/une pièce de dehors/i, /indice/, /Où chercher/, /Comptoir/, /outils de fortune/, /râtelier/]) assert.match(t, m);
  assert.doesNotMatch(t, /(?<!\p{L})replis?(?!\p{L})/u, "plus de repli (« replié » se dit encore de l'indice)");
  // « Je suis coincé » renvoie à la fiche du meuble et à ses indices.
  const q = rubrique("questions");
  assert.match(q, /Un meuble ne monte pas/);
  assert.match(q, /fiche/);
  assert.match(q, /Où chercher/);
});

test("0.8 aide : « Le gué » et « Le Moulin » disent leurs mécanismes", () => {
  const g = rubrique("gue");
  for (const m of [/radier/, /crue/, /bac/, /cloche/, /ricoche/, /se creuse/]) assert.match(g, m);
  // 0.8.2 (chantier K, décision du porteur) : l'aide ne nomme pas la glaise du gué.
  assert.doesNotMatch(g, /glaise/i);
  const m = rubrique("moulin");
  for (const x of [/grosse clé/, /grande porte/, /fosse/, /halage/, /24 h/]) assert.match(m, x);
});

test("0.8 aide : « Faire évoluer une arme » remplace « Réparer (Sac → l'arme) » : Reprendre, remettre à neuf, monter d'une étoile, le manche", () => {
  const t = rubrique("evoluer-arme");
  for (const m of [/Reprendre/, /Remettre à neuf/, /Monter d'une étoile/, /établi à étau/, /masse/]) assert.match(t, m);
  const tout = RUBRIQUES_AIDE.map(texte).join("\n");
  assert.ok(!tout.includes("**Réparer** (Sac → l'arme)"), "l'ancien texte est parti");
  assert.match(rubrique("combat"), /Faire évoluer une arme/);
});

// Recette 0.8 : un nombre et son unité ne se séparent pas en fin de ligne (« 24 h » coupé sur téléphone).
test("0.8 aide : dans les résumés, un nombre et son unité sont liés par une espace insécable", () => {
  for (const r of RUBRIQUES_AIDE) assert.ok(!/\d (h|min|km|kg|m|s|L)\b/.test(r.resume), `${r.id} : ${r.resume}`);
});

test("0.8.2 §7.6 : l'aide ne dit plus de maintenir {agir} pour ramasser ; un appui suffit, un second l'arrête", () => {
  const tout = JSON.stringify(RUBRIQUES_AIDE);
  assert.ok(!/Vise une ressource et maintiens/.test(tout));
  assert.match(tout, /appuie sur \{agir\} : un appui suffit, le geste va jusqu'au bout ; un second appui l'arrête/);
  // Le combat garde sa règle : maintenir pour le coup appuyé.
  assert.match(tout, /Coup appuyé\*\* : maintiens \{agir\}/);
});

test("0.9 aide (chantier F) : à terre, il remue encore ; détruit, il ne bouge plus et pâlit", () => {
  const tout = RUBRIQUES_AIDE.map(texte).join("\n");
  assert.match(tout, /À terre, il remue encore : achève-le\./);
  assert.match(tout, /Détruit, il ne bouge plus, et pâlit\./);
});

// Plan 0.10, chantier L : l'aide du niveau 2. Comment, jamais où est le rare ; rien de ce que le phare fait venir.

test("0.10 aide : plus aucun repli nulle part ; quatre routes ; la côte, l'hôtel et le phare ont leur rubrique", () => {
  const tout = RUBRIQUES_AIDE.map(texte).join("\n");
  assert.doesNotMatch(tout, /(?<!\p{L})replis?(?!\p{L})/iu);
  const ids = RUBRIQUES_AIDE.map((r) => r.id);
  for (const id of ["cote", "hotel", "phare"]) assert.ok(ids.includes(id), id);
  assert.match(rubrique("voyager"), /Quatre routes/);
  assert.match(rubrique("voyager"), /deux routes vers la côte/);
  assert.match(rubrique("questions"), /ton Grand Hôtel et ton phare/);
});

test("0.10 aide : le péage (douze wotts, au prix du Comptoir, à l'aller seulement), la marée, le Noyé, les bras pris", () => {
  const c = rubrique("cote");
  for (const m of [/douze wotts/, /prix où le Comptoir le reprend/, /ce qu'il refuse ne compte pas/, /une heure réelle/, /on ne paie qu'à l'aller/, /marée/, /moitié du temps/, /échelle peinte/]) assert.match(c, m);
  const e = rubrique("eteints");
  for (const m of [/Noyés/, /ne les fait pas tomber/, /la tête, ou les jambes/, /crève/, /nausée/]) assert.match(e, m);
  const b = rubrique("commandes");
  assert.match(b, /Les bras pris/);
  assert.match(b, /on ne frappe pas\*\*, même en Combat/);
  assert.match(b, /\{agir\} \*\*pose\*\*/);
});

test("0.10 aide : l'hôtel et le phare disent comment, sans divulgâcher (ni cargo, ni épave, ni où sont les objets-clés)", () => {
  const h = rubrique("hotel");
  for (const m of [/ascenseur/, /carte d'une chambre/, /borne/, /chambre 7/, /que dans ce sens-là/, /24 h/]) assert.match(h, m);
  const p = rubrique("phare");
  for (const m of [/trois mètres/, /pétrole/, /ne sert qu'à la nuit tombée/, /corne/, /une fois par nuit/, /que dans ce sens-là/, /24 h/]) assert.match(p, m);
  const tout = [h, p, rubrique("cote")].join("\n");
  for (const secret of [/cargo/i, /épave/i, /conteneur/i, /naufrag/i, /s'échoue/i, /lingerie/i, /machinerie/i, /suite/i, /tôles/i, /couvertures de laine/i, /lanterne-tempête/i, /roulements/i, /fer à souder/i, /porte de four/i, /jerrican/i, /rabot/i, /cloche/i, /soufflet/i, /tête du robot/i, /escabeau/i])
    assert.doesNotMatch(tout, secret);
});

test("0.10.1 : au téléphone, l'aide de la pose ne cite aucun geste du clavier ; au clavier, aucun mot ne change", async () => {
  const { selonLeMode } = await import("./aide.ts");
  const { avecTouches } = await import("./touches.ts");
  const lignes = RUBRIQUES_AIDE.find((r) => r.id === "fabriquer")!.blocs.flatMap((b) => (typeof b === "object" && "liste" in b ? b.liste : []));
  const ligne = (debut: string) => lignes.find((l) => l.startsWith(debut))!;
  const telephone = (l: string) => avecTouches(selonLeMode(l, true), true);
  const clavier = (l: string) => selonLeMode(l, false);
  // Au téléphone : seulement ce qui existe au doigt.
  assert.equal(telephone(ligne("Tourner :")), "Tourner : le bouton « Tourner ».");
  assert.equal(telephone(ligne("Annuler :")), "Annuler : B ou le bouton « Annuler ».");
  assert.equal(telephone(ligne("Pendant la pose")), "Pendant la pose, ton personnage ne bouge pas : c'est le fantôme qui bouge (joystick).");
  // Au clavier : les phrases d'avant, mot pour mot.
  assert.equal(clavier(ligne("Tourner :")), "Tourner : la molette, {lumiere} ou le bouton « Tourner ».");
  assert.equal(clavier(ligne("Annuler :")), "Annuler : Échap, clic droit, {examiner} ou le bouton « Annuler ».");
  assert.equal(clavier(ligne("Pendant la pose")), "Pendant la pose, ton personnage ne bouge pas : c'est le fantôme qui bouge (clavier ou joystick).");
  // Nulle part dans la rubrique, au téléphone, un geste du clavier.
  const rubriqueTel = RUBRIQUES_AIDE.find((r) => r.id === "fabriquer")!.blocs.map((b) => (typeof b === "string" ? b : "sous_titre" in b ? b.sous_titre : b.liste.join("\n"))).map(telephone).join("\n");
  for (const geste of [/Échap/, /clic droit/, /molette/, /clavier/]) assert.doesNotMatch(rubriqueTel, geste);
});
