// Tests du lot 1 de l'É5 : le sommeil (Book 05 §3) et le temps qu'il fait (Book 13).

import { test } from "node:test";
import assert from "node:assert/strict";
import { DUREE_TRANCHE_MS, attenuationMeteo, meteo, tempsDeLaTranche } from "../../commun/src/meteo.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { allureAutorisee } from "../../commun/src/survie.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { appliquerReglages } from "../../commun/src/reglages.ts";

// Ces tests vérifient le modèle au rythme réel (2 500 kcal, 2,5 L, 16 h éveillé par jour de jeu), pas le confort du jeu.
appliquerReglages({ faim_rythme: 1, soif_rythme: 1, sommeil_rythme: 1 });

function monter(inventaire: Record<string, number> = { branche: 8, bache: 1, couteau: 1 }) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "charbonniers");
  base.sauverInventaire(compte.id, inventaire);
  let instant = 1_000_000;
  const halte = new Halte(base);
  const comptoir = new Comptoir(base, instant);
  const recus: MessageServeur[] = [];
  const ouvrir = () => new Joueur(compte, base, (m) => recus.push(m), () => instant, halte, () => 1, comptoir);
  let joueur = ouvrir();
  const attendre = (secondes: number, pas = 1) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
    }
  };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const reouvrir = (ms: number) => {
    joueur.sauvegarder();
    joueur.partir();
    instant += ms;
    joueur = ouvrir();
    return joueur;
  };
  return { joueur: () => joueur, attendre, dernier, reouvrir, recus };
}

test("éveillé, on s'use : la moitié du repos en 8 heures de jeu ; épuisé, on ne court plus", () => {
  const t = monter();
  t.attendre(8 * 60, 5);
  assert.ok(Math.abs(t.joueur().bienvenue(0).besoins.repos - 0.5) < 0.02);
  assert.equal(allureAutorisee("course", { kcal: 2500, eau: 2.5, repos: 0.1 }), "marche");
});

test("dormir dans l'abri : on récupère en 8 heures ; bouger réveille", () => {
  const t = monter();
  t.joueur().position = { x: 20, z: 20, o: 0 };
  t.joueur().recevoir({ t: "fabriquer", recette: "abri", x: 20, z: 21.8, o: 0 });
  t.attendre(61);
  const abri = t.dernier("installation")!.installation;
  t.attendre(6 * 60, 5);
  const avant = t.joueur().bienvenue(0).besoins.repos;
  t.joueur().recevoir({ t: "interagir", cible: { genre: "installation", id: abri.id }, verbe: "dormir" });
  assert.deepEqual(t.dernier("sommeil"), { t: "sommeil", dort: true, dansUnAbri: true });
  t.attendre(60, 1);
  assert.ok(t.joueur().bienvenue(0).besoins.repos > avant + 0.1, "une heure dans l'abri rend 1/8");
  t.joueur().recevoir({ t: "intention", dx: 1, dz: 0, allure: "marche", seq: 1 });
  t.attendre(1);
  assert.equal(t.dernier("sommeil")!.dort, false);
});

test("se déconnecter dans son abri compte comme une nuit complète", () => {
  const t = monter();
  t.joueur().position = { x: 20, z: 20, o: 0 };
  t.joueur().recevoir({ t: "fabriquer", recette: "abri", x: 20, z: 21.8, o: 0 });
  t.attendre(61);
  t.attendre(8 * 60, 5);
  const j = t.reouvrir(10 * 60_000);
  assert.equal(j.bienvenue(0).besoins.repos, 1);
});

test("le temps qu'il fait est le même pour tous, persiste, et la pluie couvre bruits et odeurs", () => {
  // Déterministe : deux appels donnent le même temps.
  assert.equal(tempsDeLaTranche(42), tempsDeLaTranche(42));
  // Au printemps, il pleut parfois, mais pas tout le temps.
  const temps = Array.from({ length: 400 }, (_, i) => tempsDeLaTranche(i));
  const pluie = temps.filter((x) => x === "pluie").length / temps.length;
  assert.ok(pluie > 0.08 && pluie < 0.4, `part de pluie : ${pluie}`);
  const k = temps.indexOf("pluie");
  const m = meteo(k * DUREE_TRANCHE_MS + 1000, 0);
  assert.equal(m.temps, "pluie");
  assert.equal(attenuationMeteo(m, "son"), 0.7);
  assert.equal(attenuationMeteo(m, "odeur"), 0.5);
  assert.equal(attenuationMeteo(m, "lumiere"), 1);
});
