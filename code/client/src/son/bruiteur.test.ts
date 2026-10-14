import { test } from "node:test";
import assert from "node:assert/strict";
import { Bruiteur, gesteDe, solIci } from "./bruiteur.ts";
import type { Sonorisation } from "./audio.ts";

/** Une fausse sortie : elle note ce qu'on lui demande de jouer. */
function fausseSortie() {
  const joues: string[] = [];
  const menaces: string[] = [];
  const signaux: string[] = [];
  const son = {
    jouer: (id: string) => joues.push(id),
    menace: (n: string) => menaces.push(n),
    signal: (n: string) => signaux.push(n),
    continus: () => undefined,
    premierFeu: () => signaux.push("premierFeu"),
  } as unknown as Sonorisation;
  return { son, joues, menaces, signaux };
}

test("le sol sous les pieds suit les lieux", () => {
  assert.equal(solIci("terrain", 40.5, 11), "gravats"); // la ruine
  assert.equal(solIci("terrain", 10, 20), "herbe");
  assert.equal(solIci("station", 60, 35), "beton"); // la route
  assert.equal(solIci("station", 103, 14.5), "gravats"); // la boutique, verre brisé
  assert.equal(solIci("comptoir", 32, 26), "beton");
});

test("chaque action a son geste sonore", () => {
  assert.equal(gesteDe("Ramasser la branche", "leger").id, "geste_bois");
  assert.equal(gesteDe("Pédaler pour charger la batterie", "outil").continu, "chaine_velo");
  assert.equal(gesteDe("Affûter le couteau à la meule", "outil").continu, "meule");
  assert.equal(gesteDe("Forger une lame", "lourd").id, "enclume");
  assert.equal(gesteDe("Allumer le feu avec le briquet", "leger").id, "briquet");
  assert.equal(gesteDe("Une action inconnue", "lourd").id, "marteau_metal");
});

test("l'Errant devenu Attiré : le râle se coupe net, et la musique passe en Tension", () => {
  const { son, joues, menaces } = fausseSortie();
  const b = new Bruiteur(son);
  const moi = { x: 0, z: 0 };
  b.eteints(0.1, [{ id: 1, x: 10, z: 0, etat: "errant" }], moi, 0);
  assert.deepEqual(menaces, ["aucune"]);
  b.eteints(0.1, [{ id: 1, x: 10, z: 0, etat: "attire" }], moi, 0);
  assert.ok(joues.includes("eteint_rale_coupe"));
  assert.equal(menaces.at(-1), "attire");
  b.eteints(0.1, [{ id: 1, x: 5, z: 0, etat: "poursuivant" }], moi, 0);
  assert.equal(menaces.at(-1), "poursuite");
  b.eteints(0.1, [{ id: 1, x: 1, z: 0, etat: "poursuivant" }], moi, 1);
  assert.equal(menaces.at(-1), "saisie");
  assert.ok(joues.includes("saisie"));
  b.eteints(0.1, [], moi, 0);
  assert.equal(menaces.at(-1), "aucune");
});

test("un Éteint trop loin ne compte pas comme une menace", () => {
  const { son, menaces } = fausseSortie();
  new Bruiteur(son).eteints(0.1, [{ id: 1, x: 60, z: 0, etat: "poursuivant" }], { x: 0, z: 0 }, 0);
  assert.equal(menaces.at(-1), "aucune");
});

test("les pas : un son par foulée, plus espacés en courant", () => {
  const { son, joues } = fausseSortie();
  const b = new Bruiteur(son);
  for (let i = 0; i < 31; i++) b.pas("terrain", 10, 20, "marche", 0.1);
  const marche = joues.length;
  joues.length = 0;
  for (let i = 0; i < 31; i++) b.pas("terrain", 10, 20, "course", 0.1);
  assert.equal(marche, 4);
  assert.ok(joues.length < marche);
  assert.ok(joues.every((id) => id === "pas_herbe_course"));
});

test("le premier feu allumé réveille la musique ; un feu qui meurt siffle", () => {
  const { son, joues, signaux } = fausseSortie();
  const b = new Bruiteur(son);
  const feu = (aspect: "eteint" | "flammes" | "cendres") => b.monde({ feux: [{ id: 1, x: 0, z: 0, aspect }], installations: [], pluie: 0, dehors: true });
  feu("eteint");
  feu("flammes");
  assert.ok(signaux.includes("premierFeu"));
  feu("cendres");
  assert.ok(joues.includes("extinction"));
});

test("à la Coopérative, trois Éteints sur le joueur : la menace « nombre »", () => {
  const { son, menaces } = fausseSortie();
  const b = new Bruiteur(son);
  const moi = { x: 0, z: 0 };
  const trois = [
    { id: 1, x: 1, z: 0, etat: "poursuivant" as const },
    { id: 2, x: -1, z: 0, etat: "poursuivant" as const },
    { id: 3, x: 0, z: 1.5, etat: "poursuivant" as const },
  ];
  b.eteints(0.1, trois, moi, 0, true);
  assert.equal(menaces.at(-1), "nombre");
  // Hors de la Coopérative, le même encerclement reste une poursuite.
  b.eteints(0.1, trois, moi, 0, false);
  assert.equal(menaces.at(-1), "poursuite");
  // Deux seulement au contact, le troisième à 5 m : poursuite.
  b.eteints(0.1, [trois[0]!, trois[1]!, { id: 3, x: 5, z: 0, etat: "poursuivant" as const }], moi, 0, true);
  assert.equal(menaces.at(-1), "poursuite");
  // Une saisie avec deux autres au contact : le nombre ; la saisie seule : saisie.
  b.eteints(0.1, [{ ...trois[0]!, etat: "attire" as const }, trois[1]!, trois[2]!], moi, 1, true);
  assert.equal(menaces.at(-1), "nombre");
  b.eteints(0.1, [trois[0]!], moi, 1, true);
  assert.equal(menaces.at(-1), "saisie");
});

test("⚙️ le pédalier générateur : l'alternateur se lance, puis ronronne sur la chaîne ; la dynamo, la chaîne seule", () => {
  const g = gesteDe("Pédaler : l'alternateur charge la batterie", "outil");
  assert.equal(g.id, "alternateur_lance");
  assert.equal(g.continu, "chaine_velo");
  assert.equal(g.continu2, "alternateur");
  assert.ok((g.apres2 ?? 0) > 1, "le ronronnement prend la suite du lancement");
  assert.equal(gesteDe("Pédaler pour charger la batterie", "outil").continu2, undefined);
});

test("à terre, il gémit de loin en loin ; détruit, plus un son (chantier F)", () => {
  const { son, joues } = fausseSortie();
  const b = new Bruiteur(son);
  const moi = { x: 0, z: 0 };
  b.eteints(0.1, [{ id: 1, x: 4, z: 0, etat: "poursuivant" }], moi, 0);
  joues.length = 0;
  for (let t = 0; t < 8; t += 0.1) b.eteints(0.1, [{ id: 1, x: 4, z: 0, etat: "a_terre" }], moi, 0);
  const gemissements = joues.filter((j) => j === "eteint_gemit_sol").length;
  assert.ok(gemissements >= 2 && gemissements <= 6, `gémissements : ${gemissements}`);
  joues.length = 0;
  for (let t = 0; t < 8; t += 0.1) b.eteints(0.1, [{ id: 1, x: 4, z: 0, etat: "detruit" }], moi, 0);
  assert.deepEqual(joues, []);
});
