// Tests du lot 2 de l'É4 : le panneau solaire produit au calendrier, même hors ligne ; le rapport de la base. Depuis la
// 0.8 (chantier 7), le panneau se pose sur le banc solaire : un seul meuble.

import { test } from "node:test";
import { toutDevoile } from "../../commun/src/progression.ts";
import assert from "node:assert/strict";
import { MS_JOUR_CALENDRIER, productionPanneau } from "../../commun/src/energie.ts";
import { REGLAGES } from "../../commun/src/reglages.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

function monter(inventaire: Record<string, number>, avecPanneau = true) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "voltaiques");
  // Ces tests portent sur le métier, pas sur l'arbre de progression : tout est dévoilé.
  base.sauverProgression(compte.id, toutDevoile("voltaiques"));
  base.sauverInventaire(compte.id, inventaire);
  let instant = 10_000_000;
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
  joueur.position = { x: 20, z: 20, o: 0 };
  joueur.recevoir({ t: "fabriquer", recette: "banc_recharge", x: 20, z: 21.8, o: 0 });
  attendre(61);
  const banc = () => joueur.bienvenue(0).installations.find((i) => i.type === "banc_recharge");
  if (avecPanneau) {
    joueur.recevoir({ t: "interagir", cible: { genre: "installation", id: banc()!.id }, verbe: "poser_panneau" });
    attendre(21);
  }
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  /** Se déconnecter, s'absenter, revenir. */
  const absence = (ms: number) => {
    joueur.sauvegarder();
    joueur.partir();
    instant += ms;
    recus.length = 0;
    joueur = ouvrir();
    return joueur;
  };
  return { base, attendre, dernier, banc, absence, joueur: () => joueur };
}

const kit = { buche: 2, barre_metal: 1, couteau: 1, cle_plate: 1, panneau_solaire: 1, branche: 3 };

test("le petit panneau produit ≈ 80 Wh par jour de calendrier (1 h 50 réelle) au printemps", () => {
  assert.equal(Math.round(productionPanneau(MS_JOUR_CALENDRIER)), REGLAGES.panneau_wh_jour);
  assert.ok(Math.abs(MS_JOUR_CALENDRIER / 60_000 - 110) < 1);
});

test("le panneau charge les batteries posées sur le banc, même hors ligne ; le surplus est perdu", () => {
  const t = monter({ ...kit, petite_batterie: 1 });
  const banc = t.banc()!;
  assert.equal(banc.etat.panneau, true, "le panneau est sur le banc");
  assert.equal(t.joueur().bienvenue(0).installations.filter((i) => i.type === "panneau_solaire").length, 0, "un seul meuble");
  t.joueur().position = { x: banc.x, z: banc.z - 1, o: 0 };
  t.joueur().recevoir({ t: "interagir", cible: { genre: "installation", id: banc.id }, verbe: "poser_batteries" });
  t.attendre(5);
  assert.equal(t.banc()!.etat.batteries?.petite_batterie, 1);
  // Un jour de calendrier d'absence : 80 Wh produits, mais la petite batterie (50 Wh) était presque pleine.
  const j = t.absence(MS_JOUR_CALENDRIER);
  const r = j.rapport!;
  assert.ok(r, "un rapport attend le joueur");
  assert.equal(r.produit, 80);
  assert.ok(r.stocke >= 9 && r.stocke <= 11, `stocké : ${r.stocke}`);
  assert.ok(r.perdu >= 69, `perdu : ${r.perdu}`);
  assert.equal(r.surLeBanc.petite_batterie, 50);

  // On reprend les batteries : la charge revient dans le sac.
  const b = t.banc()!;
  j.position = { x: b.x, z: b.z - 1, o: 0 };
  j.recevoir({ t: "interagir", cible: { genre: "installation", id: b.id }, verbe: "reprendre_batteries" });
  t.attendre(5);
  assert.equal(Math.round(t.dernier("charges")!.charges.petite_batterie!), 50);
});

test("sans batterie posée sur le banc, l'énergie du panneau est perdue ; sans panneau, rien ne vient", () => {
  const t = monter(kit);
  const r = t.absence(MS_JOUR_CALENDRIER / 2).rapport!;
  assert.equal(r.produit, 40);
  assert.equal(r.perdu, 40);
  assert.equal(r.stocke, 0);
  // Le repli (le banc sans panneau) : la manivelle de la lampe à dynamo, rien au soleil.
  const sans = monter({ ...kit, panneau_solaire: 0 }, false);
  assert.equal(sans.banc()!.etat.panneau, undefined);
  assert.equal(sans.absence(MS_JOUR_CALENDRIER).rapport?.produit ?? 0, 0);
});

test("⚡ le banc solaire : la batterie de la ruine posée dessus prend ≈ 80 Wh par jour de soleil", () => {
  const t = monter({ ...kit, batterie_voiture: 1 });
  const banc = t.banc()!;
  t.joueur().position = { x: banc.x, z: banc.z - 1, o: 0 };
  t.joueur().recevoir({ t: "interagir", cible: { genre: "installation", id: banc.id }, verbe: "poser_batteries" });
  t.attendre(5);
  const avant = t.banc()!.etat.charges!.batterie_voiture!;
  const j = t.absence(MS_JOUR_CALENDRIER);
  assert.equal(j.rapport!.produit, 80);
  const apres = t.banc()!.etat.charges!.batterie_voiture!;
  // 80 Wh entrés, moins la décharge spontanée d'un jour (≈ 0,3 Wh).
  assert.ok(Math.abs(apres - avant - 80) < 1, `${avant} → ${apres}`);
});

test("une absence courte ne donne pas de rapport", () => {
  const t = monter(kit);
  assert.equal(t.absence(30_000).rapport, null);
});
