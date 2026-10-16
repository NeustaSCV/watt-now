// Plan 0.10.1, R-02 (corrigée par le porteur le 2026-10-16) : en hiver, la forge réchauffe à 3 m pendant un geste de
// forge et encore 2 h de jeu après (les braises) ; la charbonnière réchauffe pendant qu'elle cuit. « Au chaud », le
// surplus de faim de l'hiver tombe (`saisonSurLesBesoins`, joueur.ts).

import { test } from "node:test";
import assert from "node:assert/strict";
import { JOUR_DEPART } from "../../commun/src/calendrier.ts";
import { MS_JOUR_CALENDRIER } from "../../commun/src/energie.ts";
import type { EtatInstallation, MessageServeur, Verbe } from "../../commun/src/messages.ts";
import type { TypeInstallation } from "../../commun/src/recettes.ts";
import { toutDevoile } from "../../commun/src/progression.ts";
import { appliquerReglages } from "../../commun/src/reglages.ts";
import { MS_PAR_HEURE_JEU } from "../../commun/src/temps.ts";
import { Base } from "./base.ts";
import { Joueur } from "./joueur.ts";

appliquerReglages({ faim_rythme: 1, soif_rythme: 1, sommeil_rythme: 1, gestes_vitesse: 1 });

/** Le 3 février : le milieu de l'hiver (+ 25 % de faim). */
const MI_HIVER = 34;

function monter(inventaire: Record<string, number>, meuble: { type: TypeInstallation; etat?: EtatInstallation }) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "charbonniers");
  base.sauverProgression(compte.id, toutDevoile("charbonniers"));
  base.sauverInventaire(compte.id, { sac_a_dos: 1, ...inventaire });
  base.sauverEtat(compte.id, { kcal: 2000, eau: 1, repos: 1 }, { contenu: "potable", litres: 0 });
  const i = base.ajouterInstallation(compte.id, meuble.type, 21, 20, 0);
  if (meuble.etat) base.sauverEtatInstallation(compte.id, i.id, meuble.etat);
  const decalage = (((MI_HIVER - JOUR_DEPART) % 365) + 365) % 365;
  let instant = base.debutMonde() + decalage * MS_JOUR_CALENDRIER + 60_000;
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, undefined, () => 0.9);
  joueur.position = { x: 20, z: 20, o: 0 };
  const attendre = (secondes: number, pas = 0.5) => {
    for (let s = 0; s < secondes - 1e-9; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
    }
  };
  const prive = joueur as unknown as { saisonSurLesBesoins(instant: number): { faim: number; soif: number } };
  /** Le facteur de faim de la saison, là où l'on se tient (1 : au chaud ; 1,25 : le froid du milieu de l'hiver). */
  const faim = () => prive.saisonSurLesBesoins(instant).faim;
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const utiliser = (verbe: Verbe) => joueur.recevoir({ t: "interagir", cible: { genre: "installation", id: i.id }, verbe });
  return { joueur, attendre, faim, dernier, utiliser, sauter: (ms: number) => (instant += ms), maintenant: () => instant };
}

const FROID = 1.25;

test("R-02 : sans geste de forge, la forge est froide : l'hiver pèse", () => {
  const t = monter({}, { type: "forge", etat: { enclume: "depanneur" } });
  assert.ok(Math.abs(t.faim() - FROID) < 0.005, `×${t.faim()}`);
});

test("R-02 : la forge réchauffe pendant un geste de forge, encore 1 h de jeu après, plus 3 h après ; loin d'elle, non", () => {
  const t = monter({ barre_metal: 1, charbon_bois: 1, marteau: 1 }, { type: "forge", etat: { enclume: "depanneur" } });
  t.joueur.recevoir({ t: "fabriquer", recette: "rivet" });
  const action = t.dernier("action");
  assert.equal(action?.etat, "debut", "le rivet se forge");
  t.attendre(1);
  assert.equal(t.faim(), 1, "pendant le geste");
  // Loin de la forge (6 m), pendant le même geste : l'hiver pèse.
  t.joueur.position = { x: 15, z: 20, o: 0 };
  assert.ok(Math.abs(t.faim() - FROID) < 0.005, "loin de la forge");
  t.joueur.position = { x: 20, z: 20, o: 0 };
  t.attendre((action as { duree: number }).duree);
  assert.equal(t.dernier("inventaire")?.inventaire.charbon_bois, undefined, "le charbon a brûlé");
  t.sauter(MS_PAR_HEURE_JEU);
  assert.equal(t.faim(), 1, "1 h de jeu après : les braises");
  t.sauter(2 * MS_PAR_HEURE_JEU);
  assert.ok(Math.abs(t.faim() - FROID) < 0.005, "3 h de jeu après : la forge est froide");
});

test("R-02 : reprendre une lame sur l'enclume (un charbon) réchauffe aussi", () => {
  const t = monter({ "machette_forgee#1": 1, charbon_bois: 1 }, { type: "forge", etat: { enclume: "depanneur" } });
  t.joueur.recevoir({ t: "reprendre_arme", objet: "machette_forgee#1", geste: "monter" });
  assert.equal(t.dernier("action")?.etat, "debut");
  t.attendre(1);
  assert.equal(t.faim(), 1);
});

test("R-02 : la charbonnière réchauffe pendant qu'elle cuit ; défournée, plus", () => {
  const t = monter({ pierre_a_feu: 1 }, { type: "charbonniere" });
  assert.ok(Math.abs(t.faim() - FROID) < 0.005, "pas allumée");
  t.utiliser("allumer_meule");
  t.attendre(4);
  const pretLe = t.dernier("installation")!.installation.etat.pretLe!;
  assert.ok(pretLe > 0);
  assert.equal(t.faim(), 1, "elle cuit");
  t.joueur.position = { x: 26, z: 20, o: 0 };
  assert.ok(Math.abs(t.faim() - FROID) < 0.005, "à 5 m de la meule");
  t.joueur.position = { x: 20, z: 20, o: 0 };
  t.sauter(pretLe - t.maintenant() + 1000);
  t.utiliser("defourner");
  t.attendre(11);
  assert.ok(t.dernier("inventaire")!.inventaire.charbon_bois! > 0, "défournée");
  assert.ok(Math.abs(t.faim() - FROID) < 0.005, "défournée, la meule ne réchauffe plus");
});
