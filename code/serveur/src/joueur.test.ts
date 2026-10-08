// Tests des règles de l'É1 côté serveur, avec une horloge simulée.

import { test } from "node:test";
import assert from "node:assert/strict";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { ALLURES } from "../../commun/src/regles.ts";
import { BOIS_PAR_HEURE, KCAL_PAR_HEURE, RESERVE_KCAL_MAX } from "../../commun/src/survie.ts";
import { MARE } from "../../commun/src/terrain.ts";
import { Base } from "./base.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { appliquerReglages } from "../../commun/src/reglages.ts";

// Ces tests vérifient le modèle au rythme réel (2 500 kcal, 2,5 L, 16 h éveillé par jour de jeu), pas le confort du jeu.
appliquerReglages({ faim_rythme: 1, soif_rythme: 1, sommeil_rythme: 1 });

/** Ces tests ne portent pas sur les Éteints : aucun ne vient de la lisière. */
const JAMAIS_D_ETEINT = () => 1;

function monter(inventaire?: Record<string, number>) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "mecanistes");
  if (inventaire) base.sauverInventaire(compte.id, inventaire);
  let instant = 1_000_000;
  const recus: MessageServeur[] = [];
  const nouveau = () => new Joueur(compte, base, (m) => recus.push(m), () => instant, new Halte(base), JAMAIS_D_ETEINT);
  const joueur = nouveau();
  const attendre = (secondes: number, pas = 0.05) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
    }
  };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  return {
    base,
    compte,
    joueur,
    recus,
    attendre,
    dernier,
    infos,
    avancerHorloge: (ms: number) => (instant += ms),
    instant: () => instant,
    nouveau,
  };
}

test("le kit de départ et le terrain sont donnés à la création", () => {
  const { joueur } = monter();
  const b = joueur.bienvenue(0);
  assert.equal(b.inventaire.gourde, 1);
  assert.equal(b.inventaire.lanterne, 1, "la lumière portée des Mécanistes");
  assert.ok(b.ressources.length > 50);
  assert.ok(b.ressources.every((r) => r.disponible));
  assert.equal(b.gourde.contenu, "potable");
});

test("ramasser : trop loin, c'est refusé ; à côté, l'objet passe dans le sac", () => {
  const { joueur, attendre, dernier, infos } = monter();
  const buche = joueur.bienvenue(0).ressources.find((r) => r.type === "buche")!;
  joueur.recevoir({ t: "interagir", cible: { genre: "ressource", id: buche.id }, verbe: "ramasser" });
  assert.match(infos().at(-1)!, /trop loin/);

  joueur.position = { x: buche.x + 0.5, z: buche.z, o: 0 };
  joueur.recevoir({ t: "interagir", cible: { genre: "ressource", id: buche.id }, verbe: "ramasser" });
  assert.equal(dernier("action")?.etat, "debut");
  attendre(3);
  assert.equal(dernier("action")?.etat, "fin");
  assert.equal(dernier("inventaire")?.inventaire.buche, 1);
  assert.deepEqual(dernier("ressource"), { t: "ressource", id: buche.id, disponible: false });
});

test("bouger interrompt l'action en cours", () => {
  const { joueur, attendre, dernier } = monter();
  const pierre = joueur.bienvenue(0).ressources.find((r) => r.type === "pierre")!;
  joueur.position = { x: pierre.x, z: pierre.z + 0.5, o: 0 };
  joueur.recevoir({ t: "interagir", cible: { genre: "ressource", id: pierre.id }, verbe: "ramasser" });
  attendre(0.3);
  joueur.recevoir({ t: "intention", dx: 1, dz: 0, allure: "marche", seq: 1 });
  attendre(0.2);
  assert.equal(dernier("action")?.etat, "annulee");
  assert.equal(dernier("inventaire"), undefined);
});

test("les baies repoussent, les pierres non", () => {
  const { joueur, attendre, dernier, avancerHorloge } = monter();
  const buisson = joueur.bienvenue(0).ressources.find((r) => r.type === "buisson")!;
  joueur.position = { x: buisson.x, z: buisson.z + 0.5, o: 0 };
  joueur.recevoir({ t: "interagir", cible: { genre: "ressource", id: buisson.id }, verbe: "ramasser" });
  attendre(3);
  assert.equal(dernier("inventaire")?.inventaire.baies, 1);
  avancerHorloge(21 * 60_000);
  attendre(5.1);
  assert.deepEqual(dernier("ressource"), { t: "ressource", id: buisson.id, disponible: true });
});

test("feu de camp : monter, ajouter du bois, allumer, brûler jusqu'aux cendres", () => {
  const { joueur, attendre, dernier, infos } = monter({ pierre: 5, branche: 3, buche: 1, briquet: 1 });
  joueur.position = { x: 20, z: 20, o: 0 };
  joueur.recevoir({ t: "construire_feu", x: 21, z: 20 });
  attendre(4.1);
  const feu = dernier("feu")!.feu;
  assert.equal(feu.aspect, "eteint");
  assert.equal(dernier("inventaire")?.inventaire.pierre, undefined, "les pierres sont utilisées");

  joueur.recevoir({ t: "construire_feu", x: 21.5, z: 20.5 });
  assert.match(infos().at(-1)!, /déjà un feu|Il te faut/);

  // Ajouter du bois est immédiat : pas de geste, pas de jauge.
  joueur.recevoir({ t: "interagir", cible: { genre: "feu", id: feu.id }, verbe: "ajouter_bois" });
  assert.equal(dernier("feu")!.feu.bois, 3.5);

  joueur.recevoir({ t: "interagir", cible: { genre: "feu", id: feu.id }, verbe: "allumer" });
  attendre(2.6);
  assert.equal(dernier("feu")!.feu.aspect, "flammes");

  // 3,5 kg de bois à 1,5 kg par heure de jeu (= minute réelle) : un peu plus de 2 minutes réelles.
  attendre((3.5 / BOIS_PAR_HEURE) * 60 + 3, 0.5);
  assert.equal(dernier("feu")!.feu.aspect, "cendres");
  assert.ok(infos().some((t) => /cendres/.test(t)));
});

test("le feu brûle pendant l'absence du joueur (processus passif)", () => {
  const { joueur, attendre, dernier, avancerHorloge, nouveau } = monter({ pierre: 5, branche: 3, briquet: 1 });
  joueur.position = { x: 20, z: 20, o: 0 };
  joueur.recevoir({ t: "construire_feu", x: 21, z: 20 });
  attendre(4.1);
  const id = dernier("feu")!.feu.id;
  joueur.recevoir({ t: "interagir", cible: { genre: "feu", id }, verbe: "allumer" });
  attendre(2.6);
  joueur.sauvegarder();

  // Le joueur part 30 secondes réelles (une demi-heure de jeu), puis revient.
  avancerHorloge(30_000);
  const revenu = nouveau();
  const feu = revenu.bienvenue(0).feux.find((f) => f.id === id)!;
  // Le feu ne brûle qu'une fois allumé : 1,5 kg − une demi-heure de combustion.
  assert.ok(Math.abs(feu.bois - (1.5 - 0.5 * BOIS_PAR_HEURE)) < 0.02, `bois restant : ${feu.bois}`);
});

test("l'eau de la mare se remplit brute, et devient potable une fois bouillie", () => {
  const { joueur, attendre, dernier, infos } = monter({ pierre: 5, branche: 3, buche: 2, briquet: 1, gourde: 1 });
  joueur.position = { x: MARE.x - MARE.rayon - 0.5, z: MARE.z, o: 0 };
  joueur.recevoir({ t: "interagir", cible: { genre: "mare" }, verbe: "remplir" });
  attendre(2.1);
  assert.deepEqual(dernier("besoins")?.gourde, { contenu: "brute", litres: 1 });

  joueur.position = { x: 20, z: 20, o: 0 };
  joueur.recevoir({ t: "interagir", cible: { genre: "feu", id: 1 }, verbe: "bouillir" });
  joueur.recevoir({ t: "construire_feu", x: 21, z: 20 });
  attendre(4.1);
  joueur.recevoir({ t: "interagir", cible: { genre: "feu", id: 1 }, verbe: "ajouter_bois" });
  attendre(1.1);
  joueur.recevoir({ t: "interagir", cible: { genre: "feu", id: 1 }, verbe: "bouillir" });
  assert.match(infos().at(-1)!, /pas allumé/);
  joueur.recevoir({ t: "interagir", cible: { genre: "feu", id: 1 }, verbe: "allumer" });
  attendre(2.6);
  joueur.recevoir({ t: "interagir", cible: { genre: "feu", id: 1 }, verbe: "bouillir" });
  attendre(10.1);
  assert.deepEqual(dernier("besoins")?.gourde, { contenu: "potable", litres: 1 });
  assert.ok(dernier("feu")!.feu.bois < 3.5 - 0.45, "faire bouillir consomme du bois");
});

test("les besoins baissent avec le temps ; manger et boire les remontent", () => {
  const { joueur, attendre, dernier } = monter({ conserve: 1, gourde: 1 });
  attendre(60, 0.5); // une heure de jeu au repos
  const apres = dernier("besoins")!.besoins;
  assert.ok(Math.abs(apres.kcal - (RESERVE_KCAL_MAX - KCAL_PAR_HEURE)) < 3);

  joueur.recevoir({ t: "manger", objet: "conserve" });
  attendre(1.6);
  assert.equal(dernier("inventaire")?.inventaire.conserve, undefined);
  assert.equal(dernier("besoins")!.besoins.kcal, RESERVE_KCAL_MAX);

  const eauAvant = dernier("besoins")!.besoins.eau;
  joueur.recevoir({ t: "boire" });
  attendre(1.1);
  assert.ok(dernier("besoins")!.besoins.eau > eauAvant);
  assert.equal(dernier("besoins")!.gourde.litres, 0.75);
});

test("affamé, on ne peut plus courir", () => {
  const { joueur, base, compte, attendre, dernier } = monter();
  base.sauverEtat(compte.id, { kcal: 10, eau: 2, repos: 1 }, { contenu: "potable", litres: 1 });
  const affame = new Joueur(compte, base, () => {}, Date.now);
  affame.position = { x: 10, z: 10, o: 0 };
  affame.recevoir({ t: "intention", dx: 1, dz: 0, allure: "course", seq: 1 });
  affame.tick(1);
  assert.ok(Math.abs(affame.position.x - (10 + ALLURES.marche)) < 1e-9);
  void joueur;
  void attendre;
  void dernier;
});
