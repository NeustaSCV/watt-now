// Le contrôle des messages du client (0.1.1) : ce que le vrai client envoie passe, le reste est ignoré.

import { test } from "node:test";
import assert from "node:assert/strict";
import { messageValide } from "./controle.ts";

test("les messages du vrai client passent", () => {
  const bons: unknown[] = [
    { t: "intention", dx: 1, dz: 0, allure: "marche", seq: 3 },
    { t: "ping", envoye: 12.5 },
    { t: "interagir", cible: { genre: "feu", id: 4 }, verbe: "ajouter_bois" },
    { t: "interagir", cible: { genre: "mare" }, verbe: "remplir" },
    { t: "manger", objet: "pomme" },
    { t: "fabriquer", recette: "torche" },
    { t: "fabriquer", recette: "meule", x: 10.5, z: 3, o: 1.57 },
    { t: "construire_feu", x: 1, z: 2 },
    { t: "comptoir", op: { genre: "vendre", objet: "buche", quantite: 4 } },
    { t: "comptoir", op: { genre: "deposer", batterie: "petite_batterie" } },
    { t: "comptoir", op: { genre: "verser", montant: 12 } },
    { t: "echange", op: { genre: "offrir", offre: { objets: { buche: 2 }, wotts: 3 } } },
    { t: "echange", op: { genre: "annuler" } },
    { t: "coffre", id: 2, sens: "deposer", objet: "pierre", quantite: 5 },
    { t: "jeter", objet: "pierre", quantite: 1 },
    { t: "mesures", ips: 58, ipsBas: 40, appareil: "Mac", qualite: "haute" },
    { t: "frapper", appuye: false },
    { t: "boire" },
    { t: "tutoriel_passer" },
  ];
  for (const m of bons) assert.ok(messageValide(m), JSON.stringify(m));
});

test("les messages trafiqués sont ignorés", () => {
  const mauvais: unknown[] = [
    null,
    "intention",
    [],
    { t: "inconnu" },
    { t: "intention", dx: "1", dz: 0, allure: "marche", seq: 1 },
    { t: "intention", dx: Number.NaN, dz: 0, allure: "marche", seq: 1 },
    { t: "manger", objet: "toString" },
    { t: "manger", objet: "constructor" },
    { t: "comptoir", op: { genre: "vendre", objet: "toString", quantite: 1 } },
    { t: "comptoir", op: { genre: "vendre", objet: "buche", quantite: -1 } },
    { t: "comptoir", op: { genre: "acheter", objet: "__proto__", quantite: 1 } },
    { t: "comptoir", op: { genre: "deposer", batterie: "toString" } },
    { t: "comptoir", op: { genre: "verser", montant: -3 } },
    { t: "comptoir", op: null },
    { t: "echange", op: { genre: "offrir", offre: { objets: { toString: 1 }, wotts: 0 } } },
    { t: "echange", op: { genre: "offrir", offre: { objets: { buche: 1.5 }, wotts: 0 } } },
    { t: "echange", op: { genre: "offrir", offre: { objets: {}, wotts: -1 } } },
    { t: "coffre", id: 1, sens: "voler", objet: "pierre", quantite: 1 },
    { t: "jeter", objet: "pierre", quantite: Infinity },
    { t: "mesures", ips: 60, ipsBas: 50, appareil: "x".repeat(5000), qualite: "haute" },
  ];
  for (const m of mauvais) assert.equal(messageValide(m), false, JSON.stringify(m));
});

test("améliorer sa base (Book 24) : les gestes sur un feu ou une installation passent, visant autre chose non", () => {
  const bons: unknown[] = [
    { t: "interagir", cible: { genre: "feu", id: 1 }, verbe: "ameliorer" },
    { t: "interagir", cible: { genre: "feu", id: 2 }, verbe: "creuser_dakota" },
    { t: "interagir", cible: { genre: "feu", id: 2 }, verbe: "monter_broche" },
    { t: "interagir", cible: { genre: "installation", id: 3 }, verbe: "demonter_installation" },
    { t: "interagir", cible: { genre: "installation", id: 3 }, verbe: "redescendre" },
  ];
  for (const m of bons) assert.ok(messageValide(m), JSON.stringify(m));
  const mauvais: unknown[] = [
    { t: "interagir", cible: { genre: "mare" }, verbe: "ameliorer" },
    { t: "interagir", cible: { genre: "feu" }, verbe: "demonter_installation" },
    { t: "interagir", cible: { genre: "feu", id: 1.5 }, verbe: "combler" },
    { t: "interagir", cible: { genre: "sac", id: 1 }, verbe: "couvrir" },
  ];
  for (const m of mauvais) assert.equal(messageValide(m), false, JSON.stringify(m));
});
