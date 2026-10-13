// Les textes du jeu (0.8.2, chantier K ; plan 0.8 §9.4 : R9, R10, R11, R18). Les règles du porteur :
// - jamais le mot « clé » dans un texte affiché (c'est un mot de conception : les joueurs croiraient à de vraies clés),
//   sauf les vraies clés et ce qui en parle (`VRAIES_CLES`, plus bas) ;
// - un indice nomme le lieu, jamais l'endroit exact (`ENDROITS_PRECIS`), et ne dit rien des kits de départ ;
// - la carte ne dit pas ce qu'on trouve dans un lieu (plus de `promesse`, plus de note « panneau solaire sur l'auvent ! ») ;
// - le meuble de famille ne cite pas les armes de métier avant qu'elles soient dévoilées (R26).
//
// Deux filets : les données du jeu parcourues une à une (objets, recettes, lignées, quêtes, tutoriel, aide, lieux,
// examens), et toutes les chaînes écrites dans le code du jeu (les messages du serveur, les libellés du client), lues
// dans les sources : un message ajouté demain est vérifié sans qu'on ait à l'inscrire ici.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { ACCESSOIRES_FEU, LIGNEES_INSTALLATIONS, VOIE_CREUSEE, VOIE_SURFACE, texteAVenir } from "../../commun/src/lignees.ts";
import { LIEUX, lieuDeLEtape } from "../../commun/src/lieux.ts";
import { OBJETS, kitDeDepart, type TypeObjet } from "../../commun/src/objets.ts";
import { ARMES_DE_METIER, PROGRESSION, etapesAvecCle } from "../../commun/src/progression.ts";
import { QUETES } from "../../commun/src/quetes.ts";
import { RECETTES } from "../../commun/src/recettes.ts";
import { FAMILLES } from "../../commun/src/regles.ts";
import { USAGES } from "../../commun/src/terrain.ts";
import { REPAS_DU_TUTORIEL, etapesTutoriel } from "../../commun/src/tutoriel.ts";
import { RUBRIQUES_AIDE } from "./aide-contenu.ts";
import { dessinCarte } from "./carte.ts";
import { EXAMENS_INSTALLATIONS } from "./interaction.ts";

// ---------- « Clé » ----------

/** Le mot, seul ou au pluriel, avec ou sans majuscule (« cerclé », « clef », les identifiants `cle_…` ne comptent pas). */
const MOT_CLE = /(?<!\p{L})cl[éÉ]s?(?!\p{L})/iu;

/**
 * Les vraies clés, et ce qui en parle : la seule exception à la règle. La grosse clé du Moulin (son tableau, sa serrure,
 * la grande porte « fermée à clé ») ; la clé du coffre de la Coopérative (une vraie clé, au bout de sa chaînette
 * « MAGASIN ») ; la clé plate (l'outil, une clé de 13). Une expression ajoutée ici se justifie dans son commentaire.
 */
const VRAIES_CLES: readonly RegExp[] = [
  // Le Moulin du Gué : la grosse clé de la grande porte.
  /grosses? clés?( du Moulin)?/giu,
  /grande clé/giu,
  /ferm[ée]e? à clé/giu,
  /tableau à clés/giu,
  /petites clés rouillées/giu,
  /La clé reste dans la serrure/giu,
  /Une clé de fer longue comme la main/giu,
  // La Coopérative : la clé du coffre du magasinier.
  /clés? du coffre/giu,
  /une clé « MAGASIN »/giu,
  /petite clé à double panneton/giu,
  // L'outil : la clé plate, une clé de 13.
  /clés? plates?/giu,
  /clé de 13/giu,
];

/** Le texte, une fois retirées les vraies clés : il ne doit plus contenir le mot. */
function sansVraiesCles(texte: string): string {
  return VRAIES_CLES.reduce((t, r) => t.replace(r, "…"), texte);
}

function refuserCle(textes: Iterable<[string, string]>): string[] {
  const fautes: string[] = [];
  for (const [ou, texte] of textes) if (MOT_CLE.test(sansVraiesCles(texte))) fautes.push(`${ou} : ${texte}`);
  return fautes;
}

/** Toutes les chaînes d'une donnée, en profondeur, avec leur chemin. */
function* chaines(x: unknown, chemin: string): Generator<[string, string]> {
  if (typeof x === "string") yield [chemin, x];
  else if (Array.isArray(x)) for (const [i, v] of x.entries()) yield* chaines(v, `${chemin}[${i}]`);
  else if (x && typeof x === "object") for (const [k, v] of Object.entries(x)) yield* chaines(v, `${chemin}.${k}`);
}

/** Les textes affichables du jeu, tirés des données (et non des sources). */
function* textesDesDonnees(): Generator<[string, string]> {
  yield* chaines(OBJETS, "OBJETS");
  yield* chaines(RECETTES.map((r) => ({ id: r.id, nom: r.nom, note: (r as { note?: string }).note })), "RECETTES");
  yield* chaines(VOIE_SURFACE, "VOIE_SURFACE");
  yield* chaines(VOIE_CREUSEE, "VOIE_CREUSEE");
  yield* chaines(LIGNEES_INSTALLATIONS, "LIGNEES_INSTALLATIONS");
  yield* chaines(ACCESSOIRES_FEU, "ACCESSOIRES_FEU");
  yield* chaines(Object.fromEntries(Object.entries(PROGRESSION).map(([id, l]) => [id, l.indice])), "PROGRESSION");
  yield* chaines(QUETES, "QUETES");
  for (const f of FAMILLES) yield* chaines(etapesTutoriel(f), `TUTORIEL.${f}`);
  yield* chaines(REPAS_DU_TUTORIEL, "REPAS_DU_TUTORIEL");
  yield* chaines(RUBRIQUES_AIDE, "AIDE");
  yield* chaines(LIEUX, "LIEUX");
  yield* chaines(Object.fromEntries(Object.entries(USAGES).map(([r, u]) => [r, { libelle: u.libelle, examen: u.examen }])), "USAGES");
  yield* chaines(EXAMENS_INSTALLATIONS, "EXAMENS_INSTALLATIONS");
  yield ["texteAVenir(niveau 2)", texteAVenir("niveau 2")];
  yield ["texteAVenir(0b)", texteAVenir("0b")];
  yield ["la carte", dessinCarte()];
}

test("0.8.2 textes : aucune donnée du jeu ne dit « clé », hors les vraies clés (R9)", () => {
  const fautes = refuserCle(textesDesDonnees());
  assert.deepEqual(fautes, [], `« clé » dans :\n${fautes.join("\n")}`);
});

// Les sources : toutes les chaînes du code du jeu (guillemets et gabarits), commentaires exclus.

const RACINE = join(fileURLToPath(new URL(".", import.meta.url)), "..", "..");

/**
 * Ce qui n'est jamais montré à un joueur : la page et les outils d'administration (la « clé » de sauvegarde y est une
 * clé USB), les planches de mise au point, les modèles importés des bâtiments, la mesure, les tests.
 */
const HORS_JEU = [/\.test\.ts$/, /\/admin[^/]*\.ts$/, /cle-sauvegardes\.ts$/, /\/sauvegardes\.ts$/, /\/planche[^/]*\.ts$/, /client\/src\/batiments\//, /client\/src\/mesure\//, /gue-modele\.ts$/];

function fichiers(dossier: string): string[] {
  const r: string[] = [];
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) r.push(...fichiers(chemin));
    else if (chemin.endsWith(".ts")) r.push(chemin);
  }
  return r;
}

/**
 * Les chaînes d'un fichier TypeScript : entre "…", '…' et `…`, hors des commentaires. Dans un gabarit, chaque `${…}`
 * devient « … » dans son texte, et les chaînes qu'il contient (des gabarits imbriqués) sont relevées à part. Un petit
 * lecteur, pas un compilateur : il suffit aux sources du jeu (pas d'expression régulière qui contienne un guillemet seul).
 */
export function chainesDuSource(source: string): string[] {
  const r: string[] = [];
  /** Lit une chaîne qui commence en `i` (son guillemet) ; rend l'indice d'après. */
  const chaine = (i: number): number => {
    const q = source[i]!;
    let j = i + 1;
    let texte = "";
    while (j < source.length && source[j] !== q) {
      if (source[j] === "\\") {
        texte += source[j + 1];
        j += 2;
      } else if (q === "`" && source[j] === "$" && source[j + 1] === "{") {
        j = code(j + 2, "}");
        texte += "…";
      } else texte += source[j++];
    }
    r.push(texte);
    return j + 1;
  };
  /** Lit du code jusqu'à `fin` (une accolade fermante au même niveau), ou jusqu'au bout ; rend l'indice d'après. */
  const code = (i: number, fin: string | null): number => {
    let profondeur = 0;
    while (i < source.length) {
      const c = source[i]!;
      if (c === "/" && source[i + 1] === "/") {
        const n = source.indexOf("\n", i);
        i = n < 0 ? source.length : n;
      } else if (c === "/" && source[i + 1] === "*") {
        const n = source.indexOf("*/", i + 2);
        i = n < 0 ? source.length : n + 2;
      } else if (c === '"' || c === "'" || c === "`") i = chaine(i);
      else if (c === "{") {
        profondeur++;
        i++;
      } else if (c === "}") {
        if (fin && profondeur === 0) return i + 1;
        profondeur--;
        i++;
      } else i++;
    }
    return i;
  };
  code(0, null);
  return r;
}

test("0.8.2 textes : aucune chaîne du code du jeu ne dit « clé », hors les vraies clés (R9)", () => {
  const sources = ["commun/src", "client/src", "serveur/src"].flatMap((d) => fichiers(join(RACINE, d))).filter((f) => !HORS_JEU.some((r) => r.test(f)));
  assert.ok(sources.length > 100, `${sources.length} fichiers lus`);
  const fautes = refuserCle(sources.flatMap((f) => chainesDuSource(readFileSync(f, "utf8")).map((t): [string, string] => [relative(RACINE, f), t])));
  assert.deepEqual(fautes, [], `« clé » dans :\n${fautes.join("\n")}`);
});

test("0.8.2 textes : le lecteur de sources trouve les chaînes et saute les commentaires", () => {
  const s = `// la clé d'un commentaire\nconst a = "une clé"; /* clé */ const b = \`la \${x} clé\`; const c = 'l\\'abri';`;
  assert.deepEqual(chainesDuSource(s), ["une clé", "la … clé", "l'abri"]);
  // Un gabarit dans un gabarit : chacun pour soi, sans perdre le fil.
  assert.deepEqual(chainesDuSource("const a = `x ${b ? `oui ${c}` : \"non\"} y`; const d = 'fin';"), ["oui …", "non", "x … y", "fin"]);
  assert.deepEqual(refuserCle([["x", "La grosse clé du Moulin, fermée à clé."], ["y", "Une clé plate."], ["z", "Sa clé est à trouver plus loin."]]), ["z : Sa clé est à trouver plus loin."]);
  assert.deepEqual(refuserCle([["x", "Un coffre cerclé."], ["y", "Les Clés du jeu"]]), ["y : Les Clés du jeu"]);
});

// ---------- Les indices (R10) ----------

/**
 * Les endroits plus précis qu'un lieu, interdits dans un indice (R10 : « à la Coopérative », jamais « les palettes du
 * quai »). La liste vient des indices d'avant la 0.8.2 et des coins des lieux du niveau 1 (la station, la Coopérative, le
 * gué, le Moulin) : un indice qui y reviendrait la ferait échouer. À compléter quand un lieu s'ajoute.
 */
export const ENDROITS_PRECIS: readonly RegExp[] = [
  // La station : l'auvent et son pilier, le garage et son établi, la boutique.
  "auvent", "pilier", "garage", "établi", "boutique", "atelier du",
  // La Coopérative : le parc à volailles, la laiterie, la cuisine, le quai et ses palettes, le rayon, la tête de gondole.
  "parc à volailles", "laiterie", "la cuisine", "quai", "palettes", "rayon", "gondole", "hangar",
  // Le gué : la berge, le camping-car, la cabane, la buvette, les barques, le lavoir.
  "berge", "camping-car", "cabane", "buvette", "barques", "lavoir",
  // Le Moulin : le magasin, les barils, les sacs de jute, les meules, le rhabilleur, l'étable, le logis, le bief.
  "magasin", "barils", "sacs de jute", "meules", "rhabilleur", "étable", "logis", "bief",
  // Les lieux d'après (« plus loin ») : leurs coins non plus.
  "fournil", "remise", "les lits",
  // Les tournures d'endroit exact.
  "sous l'", "sous le", "sous la", "sur l'", "sur le", "sur la", "contre le", "contre la", "au fond",
  // Des mots entiers (« berge », pas « auberge ») ; « sous l' » se suit d'une lettre.
].map((mot) => new RegExp(`(?<!\\p{L})${mot}${/\p{L}$/u.test(mot) ? "(?!\\p{L})" : ""}`, "iu"));

/** Le second temps de l'indice : le lieu, et rien de plus. */
const LIEU_DE_L_INDICE: Readonly<Record<string, string>> = {
  station: "À la station.",
  cooperative: "À la Coopérative.",
  gue: "Au Gué-aux-Saules.",
  moulin: "Au Moulin du Gué.",
};
const PLUS_LOIN = "Plus loin, pas encore sur ta carte.";

test("0.8.2 indices : le second temps nomme le lieu, rien de plus ; le premier, un genre de lieu ; aucun endroit précis (R10)", () => {
  const etapes = etapesAvecCle();
  assert.ok(etapes.length >= 15, `${etapes.length} étapes à indice`);
  for (const { etape } of etapes) {
    const [genre, lieu] = etape.cle.indice;
    const attendu = LIEU_DE_L_INDICE[lieuDeLEtape(etape.cle.ou) ?? ""] ?? PLUS_LOIN;
    assert.equal(lieu, attendu, `${etape.id} : le lieu de l'indice`);
    for (const t of [genre, lieu]) {
      for (const r of ENDROITS_PRECIS) assert.doesNotMatch(t, r, `${etape.id} : « ${t} » est trop précis`);
      assert.ok(t.length <= 60, `${etape.id} : « ${t} » est trop long (${t.length})`);
    }
    assert.match(genre, /\?/, `${etape.id} : le premier temps pose la question (« Une grille ? … »)`);
  }
});

test("0.8.2 indices : rien des kits de départ (R10)", () => {
  // Les objets d'un kit, par leur nom affiché : un indice ne les cite jamais (le joueur ne sait pas ce qu'ont les autres).
  const kits = new Set(FAMILLES.flatMap((f) => Object.keys(kitDeDepart(f)) as TypeObjet[]));
  const noms = [...kits].map((t) => OBJETS[t].nom.toLowerCase());
  for (const { etape } of etapesAvecCle()) {
    for (const t of etape.cle.indice) for (const n of noms) assert.ok(!t.toLowerCase().includes(n), `${etape.id} : « ${t} » cite « ${n} », d'un kit`);
    assert.doesNotMatch(etape.cle.indice.join(" "), /\bkit\b/i);
  }
});

// ---------- La carte (R18, Q-0.8.2-8) ----------

test("0.8.2 carte : elle ne promet rien ; plus de note « panneau solaire sur l'auvent ! »", () => {
  for (const l of Object.values(LIEUX)) assert.ok(!("promesse" in l), `${l.id} a encore une promesse`);
  const svg = dessinCarte();
  assert.doesNotMatch(svg, /panneau solaire/i);
  assert.doesNotMatch(svg, /auvent/i);
  // La fiche d'un lieu ne lit plus de promesse (la source de la carte n'en parle plus).
  assert.doesNotMatch(readFileSync(join(RACINE, "client/src/carte.ts"), "utf8"), /\.promesse/);
});

// ---------- Les meubles de famille et les armes (R26) ----------

test("0.8.2 meubles de famille : « apporte » ne cite aucune arme de métier avant son dévoilement (R26)", () => {
  // Les noms des armes de métier et de leurs pièces (le nom de la recette, et celui de l'objet qu'elle fait).
  const noms = new Set<string>();
  for (const ids of Object.values(ARMES_DE_METIER))
    for (const id of ids) {
      const r = RECETTES.find((x) => x.id === id);
      if (!r) continue;
      noms.add(r.nom.toLowerCase().replace(/ \(.*\)$/, ""));
      if ("objet" in r.produit) noms.add(OBJETS[r.produit.objet].nom.toLowerCase());
    }
  // Les noms courts qu'on dit en passant (« couteau et machette », « matraques »).
  const mots = [/machette/i, /hachette/i, /\bhache\b/i, /glaive/i, /couteau/i, /matraque/i, /aiguillon/i, /arbalète/i, /carreau/i, /\bmodules?\b/i];
  for (const type of ["forge", "banc_recharge", "pedalier"] as const) {
    for (const e of LIGNEES_INSTALLATIONS[type]!) {
      for (const r of mots) assert.doesNotMatch(e.apporte, r, `${e.nom} : « ${e.apporte} »`);
      for (const n of noms) assert.ok(!e.apporte.toLowerCase().includes(n), `${e.nom} cite « ${n} »`);
    }
  }
});

// ---------- Les textes faux d'avant (R11 ; la recette de la 0.8) ----------

test("0.8.2 textes : l'abri ne parle plus du lit posé à côté (R11) ; la glaise est au milieu de la berge ; le banc n'a qu'une batterie", () => {
  const abri = LIGNEES_INSTALLATIONS.abri!;
  for (const e of abri) assert.doesNotMatch(`${e.apporte} ${e.examen}`, /à moins de 3 m|à côté/i, e.nom);
  const lit = QUETES.find((q) => q.id === "lit")!;
  assert.doesNotMatch(lit.lecon, /à côté/);
  const aide = RUBRIQUES_AIDE.map((r) => JSON.stringify(r.blocs)).join(" ");
  assert.doesNotMatch(aide, /lit à côté|ton lit\)/);
  assert.doesNotMatch(USAGES.gisement_glaise.examen, /camping-car/);
  assert.doesNotMatch(readFileSync(join(RACINE, "client/src/hud.ts"), "utf8"), /batteries du banc/);
  for (const e of LIGNEES_INSTALLATIONS.banc_recharge!) assert.doesNotMatch(e.apporte, /ses batteries/);
});

test("0.8.2 indices : la liste des endroits précis attrape les indices d'avant (et pas une auberge)", () => {
  const trop = (t: string) => ENDROITS_PRECIS.some((r) => r.test(t));
  for (const avant of ["Le parc à volailles de la Coopérative.", "Sous l'établi du garage de la station.", "Le pilier de l'auvent de la station.", "Les sacs de jute du magasin, au Moulin du Gué.", "La laiterie de la Coopérative.", "Le quai d'un lieu plus loin.", "L'établi du rhabilleur, aux meules du Moulin du Gué."])
    assert.ok(trop(avant), avant);
  for (const apres of ["À la Coopérative.", "Au Moulin du Gué.", "De la vraie laine ? Une auberge, un hôtel."]) assert.ok(!trop(apres), apres);
});
