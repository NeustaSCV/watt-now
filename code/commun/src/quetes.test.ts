// Plan 0.8, chantier 13 : « S'installer » en portes successives (§2.6, Q-0.8-19), et aucune quête qui demande un niveau
// « plus tard ». Le suivi côté serveur (les portes qui se valident sur le terrain) est dans serveur/src/portes.test.ts.

import { test } from "node:test";
import assert from "node:assert/strict";
import { ACCESSOIRES_FEU, LIGNEES_INSTALLATIONS, VOIE_CREUSEE, VOIE_SURFACE, etapeAccessoire, lignee, type Etape } from "./lignees.ts";
import { recetteDeBase } from "./progression.ts";
import { PORTES_OUVERTES_MAX, QUETES, phraseDuDepart, quetesOuvertes, queteSuivante, type Condition } from "./quetes.ts";
import { recette } from "./recettes.ts";
import { FAMILLES } from "./regles.ts";

const ids = (qs: { id: string }[]) => qs.map((q) => q.id);

test("« S'installer » : le foyer de pierres en tête, puis un vrai repas, l'eau du ciel, le coffre, un vrai lit, une à une", () => {
  const finies: string[] = [];
  // Plan 0.8 §9.3 (0.8.2, chantier J) : « Un vrai lit » juste après le coffre, avant les portes.
  for (const attendu of ["foyer_pierres", "repas", "eau_du_ciel", "coffre", "lit"]) {
    assert.deepEqual(ids(quetesOuvertes("installer", "charbonniers", finies)), [attendu]);
    finies.push(attendu);
  }
});

test("puis les portes du niveau 1 : deux ouvertes à la fois, une par route (Q-0.8-19)", () => {
  const tete = ["foyer_pierres", "repas", "eau_du_ciel", "coffre", "lit"];
  assert.deepEqual(ids(quetesOuvertes("installer", "voltaiques", tete)), ["foyer_cuisine", "abri_ferme"]);
  // Finir une porte de la route A ouvre la suivante de la même route ; l'autre route ne bouge pas.
  assert.deepEqual(ids(quetesOuvertes("installer", "voltaiques", [...tete, "foyer_cuisine"])), ["abri_ferme", "marmite"]);
  assert.deepEqual(ids(quetesOuvertes("installer", "voltaiques", [...tete, "abri_ferme", "coffre_cercle"])), ["foyer_cuisine", "etabli_etau"]);
  // Une route finie : sa place passe à ce qui suit les portes.
  const routeA = ["foyer_cuisine", "marmite", "dix_litres"];
  assert.deepEqual(ids(quetesOuvertes("installer", "voltaiques", [...tete, ...routeA])), ["abri_ferme", "dakota"]);
  // Les deux routes finies : la gamme bushcraft reprend, une à une.
  const routeB = ["abri_ferme", "coffre_cercle", "etabli_etau"];
  assert.deepEqual(ids(quetesOuvertes("installer", "voltaiques", [...tete, ...routeA, ...routeB])), ["dakota"]);
  // Le lit vient juste après le coffre, avant la première porte.
  const installer = ids(QUETES.filter((q) => q.ligne === "installer"));
  assert.equal(installer.indexOf("lit"), installer.indexOf("coffre") + 1);
  assert.ok(installer.indexOf("lit") < installer.indexOf("foyer_cuisine"));
  // Les portes : une par meuble, trois par route, dans l'ordre décidé.
  const portes = QUETES.filter((q) => q.route);
  assert.deepEqual(portes.filter((q) => q.route === "A").map((q) => q.titre), ["Une vraie cuisine", "La soupe qui cuit seule", "Dix litres"]);
  assert.deepEqual(portes.filter((q) => q.route === "B").map((q) => q.titre), ["Un abri fermé", "Un coffre cerclé", "L'établi à étau"]);
  for (const q of portes) assert.ok(q.besoin && q.icone, `${q.id} : sa clé en quelques mots, son icône`);
  // Jamais plus de deux à la fois, quel que soit l'avancement ; les autres lignes, une seule.
  for (let n = 0; n <= 20; n++) {
    const finies = QUETES.filter((q) => q.ligne === "installer").slice(0, n).map((q) => q.id);
    assert.ok(quetesOuvertes("installer", "mecanistes", finies).length <= PORTES_OUVERTES_MAX);
  }
  for (const famille of FAMILLES) assert.equal(quetesOuvertes("metier", famille, []).length, 1);
  assert.equal(queteSuivante("installer", "voltaiques", tete)!.id, "foyer_cuisine");
});

test("au départ d'une sortie, le carnet nomme les portes ouvertes", () => {
  const tete = ["foyer_pierres", "repas", "eau_du_ciel", "coffre", "lit"];
  const phrase = phraseDuDepart(quetesOuvertes("installer", "charbonniers", tete))!;
  assert.equal(phrase, "Une vraie cuisine : il te faut une grille. Un abri fermé : il te faut de la grosse toile.");
  assert.equal(phraseDuDepart(quetesOuvertes("installer", "charbonniers", [])), null, "pas de porte ouverte : rien à dire");
  // Le message tient en deux lignes en haut de l'écran, même avec les deux plus longues.
  for (const a of QUETES.filter((q) => q.route === "A")) for (const b of QUETES.filter((q) => q.route === "B")) assert.ok(phraseDuDepart([a, b])!.length <= 110);
});

/** Toutes les étapes de toutes les lignées (le feu et ses accessoires compris). */
const ETAPES: Etape[] = [
  ...VOIE_SURFACE,
  ...VOIE_CREUSEE,
  ...Object.values(ACCESSOIRES_FEU).map(etapeAccessoire),
  ...Object.values(LIGNEES_INSTALLATIONS).flatMap((l) => [...(l ?? [])]),
];

/** Toutes les étapes de lignée qu'une condition demande (un niveau d'installation, une forme de feu, un niveau noté). */
function etapesDemandees(c: Condition): Etape[] {
  switch (c.a) {
    case "installation": {
      const e = lignee(c.type)?.[(c.niveau ?? 1) - 1];
      return e ? [e] : [];
    }
    case "fait": {
      // « foyer:<forme> » (le feu), « niveau:<étape> » (une installation montée), « accessoire:<id> » (la marmite).
      const [genre, id] = c.fait.split(":");
      return genre === "foyer" || genre === "niveau" || genre === "accessoire" ? ETAPES.filter((e) => e.id === id) : [];
    }
    case "un_de":
      return c.conditions.flatMap(etapesDemandees);
    default:
      return [];
  }
}

/** Les recettes qu'une condition fait fabriquer (`fabrique:<recette>`), et la voie de base des objets demandés. */
function recettesDemandeesPar(c: Condition): string[] {
  switch (c.a) {
    case "fait":
      return c.fait.startsWith("fabrique:") ? [c.fait.slice("fabrique:".length)] : [];
    case "faits":
      return c.faits.flatMap((f) => (f.startsWith("fabrique:") ? [f.slice("fabrique:".length)] : []));
    case "objet":
      return c.types.flatMap((t) => (recetteDeBase(t) ? [recetteDeBase(t)!.id] : []));
    case "un_de":
      return c.conditions.flatMap(recettesDemandeesPar);
    default:
      return [];
  }
}

test("aucune quête ne demande un niveau « plus tard » (ni une recette grisée « plus tard »)", () => {
  for (const q of QUETES) {
    for (const o of q.objectifs) {
      for (const e of etapesDemandees(o.condition)) assert.ok(!e.aVenir, `${q.id} : ${e.nom} est « plus tard »`);
      // Une condition « l'un ou l'autre » : au moins une voie jouable ; une condition seule : jouable.
      const ids = recettesDemandeesPar(o.condition);
      if (ids.length > 0) assert.ok(ids.some((id) => !recette(id)?.aVenir), `${q.id} : ${ids.join(", ")} sont toutes « plus tard »`);
      if (o.condition.a !== "un_de") for (const id of ids) assert.ok(!recette(id)?.aVenir, `${q.id} : ${id} est « plus tard »`);
    }
  }
  // La mise d'acier : la hachette au foyer de forge (Q-0.8-10), plus la hache de la forge ventilée.
  const mise = QUETES.find((q) => q.id === "mise_acier")!;
  assert.deepEqual([...new Set(recettesDemandeesPar(mise.objectifs[0]!.condition))], ["hachette"]);
  // Les niveaux notés (« niveau:<étape> ») des portes : chacun est une vraie étape de sa lignée.
  for (const q of QUETES.filter((x) => x.route)) assert.ok(etapesDemandees(q.objectifs[0]!.condition).length > 0, q.id);
});

test("les quêtes de métier revues : le banc solaire, le pédalier générateur, le bac et la glaise, la hachette, le couteau au fer doux", () => {
  const q = (id: string) => QUETES.find((x) => x.id === id)!;
  assert.equal(q("panneau_pose").titre, "Le banc solaire");
  assert.match(q("panneau_pose").texte, /banc solaire/);
  assert.equal(q("dynamo").titre, "Le pédalier générateur");
  assert.match(q("dynamo").texte, /alternateur/);
  assert.match(q("trempe").texte, /glaise du gué/);
  assert.match(q("mise_acier").texte, /foyer de forge/);
  assert.match(q("lame").texte, /fer doux/);
  assert.equal(recetteDeBase("lame_forgee")!.id, "lame_forgee_fer");
  // Q-0.8-11 : « pommes cuites, ou une poêlée ».
  assert.match(q("repas").texte, /pommes cuites, ou une poêlée/);
  // L'eau du ciel : le récupérateur de 5 L, plus de bâche ni de bassine.
  assert.doesNotMatch(q("eau_du_ciel").texte, /bâche|bassine/);
  assert.match(q("eau_du_ciel").texte, /bidon de 5 L/);
});
