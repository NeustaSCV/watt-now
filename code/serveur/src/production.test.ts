// Tests du lot 2 de l'É4 : le panneau solaire produit au calendrier, même hors ligne ; le rapport de la base. Depuis la
// 0.8 (chantier 7), le panneau se pose sur le banc solaire : un seul meuble. Depuis la 0.10 (chantier D, S-30), il suit
// le soleil : rien la nuit ni sous la pluie, ≈ 162 Wh par beau jour de calendrier (80 en moyenne, V1-02) ; les tests comparent au soleil du monde.

import { test } from "node:test";
import { toutDevoile } from "../../commun/src/progression.ts";
import assert from "node:assert/strict";
import { MS_JOUR_CALENDRIER, productionPanneau, whParBeauJour } from "../../commun/src/energie.ts";
import { MS_PAR_JOUR_JEU } from "../../commun/src/temps.ts";
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
  // Le monde commence au lancement de la base : on part une minute après (7 h du matin, le temps de la première tranche).
  let instant = base.debutMonde() + 60_000;
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
  /** Le soleil de la dernière absence (Wh) : ce que le panneau a pu produire, de l'instant du départ au retour. */
  let soleil = 0;
  /** Se déconnecter, s'absenter, revenir. */
  const absence = (ms: number) => {
    joueur.sauvegarder();
    joueur.partir();
    soleil = productionPanneau(instant, instant + ms, base.debutMonde());
    instant += ms;
    recus.length = 0;
    joueur = ouvrir();
    return joueur;
  };
  return { base, attendre, dernier, banc, absence, joueur: () => joueur, soleil: () => soleil };
}

const kit = { buche: 2, barre_metal: 1, couteau: 1, cle_plate: 1, panneau_solaire: 1, branche: 3 };

// Plan 0.10 (V1-02) : compensé pour la vraie météo, un beau jour donne ≈ 162 Wh (80 en moyenne sur le temps qu'il fait).
test("le petit panneau produit ≈ 162 Wh par beau jour de calendrier (1 h 50 réelle) au printemps (S-30, V1-02)", () => {
  assert.ok(Math.abs(MS_JOUR_CALENDRIER / 60_000 - 110) < 1);
  const soleil = () => "soleil" as const;
  // 73 jours de calendrier font juste 336 jours de jeu : tout au soleil, ≈ 162 Wh par jour, exactement.
  assert.ok(Math.abs((73 * MS_JOUR_CALENDRIER) / MS_PAR_JOUR_JEU - 336) < 1e-9);
  assert.ok(Math.abs(productionPanneau(0, 73 * MS_JOUR_CALENDRIER, 0, soleil) - 73 * whParBeauJour()) < 1e-6);
  // Un seul jour de calendrier commence à n'importe quelle heure : ≈ 162 Wh, à la nuit près.
  for (const depart of [0, 7 * 60_000, 15 * 60_000]) {
    const wh = productionPanneau(depart, depart + MS_JOUR_CALENDRIER, 0, soleil);
    assert.ok(Math.abs(wh - whParBeauJour()) < 20, `${wh}`);
  }
});

test("le panneau charge la batterie du banc, même hors ligne ; le surplus est perdu", () => {
  const t = monter({ ...kit, batterie_voiture: 1, sac_a_dos: 1 });
  const banc = t.banc()!;
  assert.equal(banc.etat.panneau, true, "le panneau est sur le banc");
  assert.equal(t.joueur().bienvenue(0).installations.filter((i) => i.type === "panneau_solaire").length, 0, "un seul meuble");
  t.joueur().position = { x: banc.x, z: banc.z - 1, o: 0 };
  t.joueur().recevoir({ t: "interagir", cible: { genre: "installation", id: banc.id }, verbe: "poser_batteries" });
  t.attendre(5);
  assert.equal(t.banc()!.etat.batteries?.batterie_voiture, 1);
  // Huit jours de calendrier d'absence : le soleil du monde dépasse les 180 Wh qui manquaient à la batterie de la ruine
  // (360 Wh, à moitié pleine) ; le reste est perdu.
  const j = t.absence(8 * MS_JOUR_CALENDRIER);
  const r = j.rapport!;
  assert.ok(r, "un rapport attend le joueur");
  assert.ok(t.soleil() > 200, `soleil : ${t.soleil()}`);
  assert.ok(Math.abs(r.produit - t.soleil()) <= 1, `produit : ${r.produit} pour ${t.soleil()}`);
  assert.ok(r.stocke >= 179 && r.stocke <= 181, `stocké : ${r.stocke}`);
  assert.ok(Math.abs(r.perdu - (r.produit - r.stocke)) <= 1, `perdu : ${r.perdu}`);
  // Pleine, moins la décharge spontanée de la fin de l'absence (≈ 1 % en huit jours de calendrier).
  assert.ok(r.surLeBanc.batterie_voiture! >= 354, `sur le banc : ${r.surLeBanc.batterie_voiture}`);

  // Le banc démonté rend sa batterie, et ce qu'elle contient.
  const b = t.banc()!;
  j.position = { x: b.x, z: b.z - 1, o: 0 };
  j.recevoir({ t: "interagir", cible: { genre: "installation", id: b.id }, verbe: "demonter_installation" });
  t.attendre(40);
  assert.ok(Math.round(t.dernier("charges")?.charges.batterie_voiture ?? 0) >= 354, JSON.stringify(t.dernier("info")));
});

test("sans batterie posée sur le banc, l'énergie du panneau est perdue ; sans panneau, rien ne vient", () => {
  const t = monter(kit);
  const r = t.absence(MS_JOUR_CALENDRIER / 2).rapport!;
  assert.ok(Math.abs(r.produit - t.soleil()) <= 1, `produit : ${r.produit} pour ${t.soleil()}`);
  assert.equal(r.perdu, r.produit);
  assert.equal(r.stocke, 0);
  // Le repli (le banc sans panneau) : la manivelle de la lampe à dynamo, rien au soleil.
  const sans = monter({ ...kit, panneau_solaire: 0 }, false);
  assert.equal(sans.banc()!.etat.panneau, undefined);
  assert.equal(sans.absence(MS_JOUR_CALENDRIER).rapport?.produit ?? 0, 0);
});

test("⚡ le banc solaire : la batterie de la ruine posée dessus prend le soleil d'un jour", () => {
  const t = monter({ ...kit, batterie_voiture: 1 });
  const banc = t.banc()!;
  t.joueur().position = { x: banc.x, z: banc.z - 1, o: 0 };
  t.joueur().recevoir({ t: "interagir", cible: { genre: "installation", id: banc.id }, verbe: "poser_batteries" });
  t.attendre(5);
  const avant = t.banc()!.etat.charges!.batterie_voiture!;
  const j = t.absence(MS_JOUR_CALENDRIER);
  assert.ok(Math.abs(j.rapport!.produit - t.soleil()) <= 1, `produit : ${j.rapport!.produit} pour ${t.soleil()}`);
  const apres = t.banc()!.etat.charges!.batterie_voiture!;
  // Le soleil du jour entré, moins la décharge spontanée d'un jour (≈ 0,3 Wh).
  assert.ok(Math.abs(apres - avant - t.soleil()) < 1.5, `${avant} → ${apres} pour ${t.soleil()}`);
});

test("une absence courte ne donne pas de rapport", () => {
  const t = monter(kit);
  assert.equal(t.absence(30_000).rapport, null);
});
