// Tests du lot 2 de l'É2 : la chaîne de chaque famille (charbonnière et forge, pédalier, banc de recharge).

import { test } from "node:test";
import assert from "node:assert/strict";
import { CHARGE_TROUVEE, DUREE_CHARBONNIERE_MS, whEDePedalage } from "../../commun/src/energie.ts";
import type { MessageServeur, Verbe } from "../../commun/src/messages.ts";
import type { Famille } from "../../commun/src/regles.ts";
import { Base } from "./base.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { appliquerReglages } from "../../commun/src/reglages.ts";

// Ces tests vérifient le modèle au rythme réel (2 500 kcal, 2,5 L, 16 h éveillé par jour de jeu), pas le confort du jeu.
appliquerReglages({ faim_rythme: 1, soif_rythme: 1, sommeil_rythme: 1 });

/** Ces tests ne portent pas sur les Éteints : aucun ne vient de la lisière. */
const JAMAIS_D_ETEINT = () => 1;

function monter(famille: Famille, inventaire: Record<string, number>) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", famille);
  // Un sac à dos, comme dans le kit de départ (sans lui, on ne porte que 10 kg).
  base.sauverInventaire(compte.id, { sac_a_dos: 1, ...inventaire });
  let instant = 1_000_000;
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, new Halte(base), JAMAIS_D_ETEINT);
  joueur.position = { x: 20, z: 20, o: 0 };
  const attendre = (secondes: number, pas = 0.5) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
    }
  };
  const sauter = (ms: number) => (instant += ms);
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  /** Construit une installation juste devant le joueur et renvoie son id. */
  const construire = (recette: string, duree: number) => {
    joueur.recevoir({ t: "fabriquer", recette, x: 20, z: 21.8, o: 0 });
    attendre(duree + 1);
    return dernier("installation")!.installation.id;
  };
  const utiliser = (id: number, verbe: Verbe) => joueur.recevoir({ t: "interagir", cible: { genre: "installation", id }, verbe });
  return { base, compte, joueur, attendre, sauter, dernier, infos, construire, utiliser, recus };
}

test("🔥 charbonnière : allumer, attendre trois jours de jeu, défourner 4 kg de charbon", () => {
  const t = monter("charbonniers", { buche: 10, branche: 4, pierre_a_feu: 1 });
  const id = t.construire("charbonniere", 60);
  t.utiliser(id, "defourner");
  t.utiliser(id, "allumer_meule");
  t.attendre(4);
  const pretLe = t.dernier("installation")!.installation.etat.pretLe!;
  assert.ok(pretLe > 0);

  t.utiliser(id, "defourner");
  assert.match(t.infos().at(-1)!, /pas encore prêt/);

  t.sauter(DUREE_CHARBONNIERE_MS);
  t.attendre(2);
  assert.match(t.infos().at(-1)!, /charbon est prêt/);
  t.utiliser(id, "defourner");
  t.attendre(11);
  assert.equal(t.dernier("inventaire")!.inventaire.charbon_bois, 4);
  assert.deepEqual(t.dernier("installation_retiree"), { t: "installation_retiree", id });
  assert.equal(t.joueur.bienvenue(0).installations.length, 0);
});

test("🔥 la lame se forge seulement près d'un foyer de forge, avec charbon et marteau", () => {
  const t = monter("charbonniers", { pierre: 8, barre_metal: 1, branche: 2, marteau: 1, ressort_lames: 1, charbon_bois: 2 });
  t.joueur.recevoir({ t: "fabriquer", recette: "lame_forgee" });
  assert.match(t.infos().at(-1)!, /foyer de forge/);
  t.construire("forge", 90);
  t.joueur.recevoir({ t: "fabriquer", recette: "lame_forgee" });
  t.attendre(91);
  const inv = t.dernier("inventaire")!.inventaire;
  assert.equal(inv.lame_forgee, 1);
  assert.equal(inv.charbon_bois, 1);
  assert.equal(inv.ressort_lames, undefined);
});

test("⚙️ pédalier : dynamo montée, une heure de pédalage charge la batterie et coûte des calories", () => {
  const t = monter("mecanistes", { cadre_velo: 1, chaine_velo: 1, roue_velo: 1, buche: 2, cle_plate: 1, couteau: 1, pierre: 4, dynamo_velo: 1, batterie_voiture: 1 });
  const id = t.construire("pedalier", 90);
  t.utiliser(id, "pedaler");
  t.attendre(1);
  assert.equal(t.dernier("installation")!.installation.etat.dynamo, undefined);

  t.utiliser(id, "monter_dynamo");
  t.attendre(21);
  assert.equal(t.dernier("installation")!.installation.etat.dynamo, true);

  const avant = t.dernier("charges")?.charges.batterie_voiture ?? CHARGE_TROUVEE.batterie_voiture;
  const kcalAvant = t.joueur.bienvenue(0).besoins.kcal;
  t.utiliser(id, "pedaler");
  t.attendre(61);
  const apres = t.dernier("charges")!.charges.batterie_voiture!;
  // Mécaniste : 100 Wh_m × 1,3 × 60 % = 78 Wh
  assert.equal(Math.round(apres - avant), 78);
  assert.equal(whEDePedalage("mecanistes"), 78);
  // Repos (≈ 104 kcal/h) + 250 de plus pour l'effort
  assert.ok(kcalAvant - t.joueur.bienvenue(0).besoins.kcal > 300);
});

test("⚙️ pédalier : la meule de pierre affûte le couteau (Couper 2)", () => {
  const t = monter("mecanistes", { cadre_velo: 1, chaine_velo: 1, roue_velo: 1, buche: 2, cle_plate: 1, couteau: 1, pierre: 4 });
  const id = t.construire("pedalier", 90);
  t.utiliser(id, "monter_meule");
  t.attendre(21);
  assert.equal(t.dernier("installation")!.installation.etat.meule, true);
  t.utiliser(id, "affuter");
  t.attendre(31);
  const inv = t.dernier("inventaire")!.inventaire;
  assert.equal(inv.couteau_aiguise, 1);
  assert.equal(inv.couteau, undefined);
});

test("⚡ banc : la batterie de voiture recharge la petite batterie à 85 %", () => {
  const t = monter("voltaiques", { buche: 2, barre_metal: 1, couteau: 1, cle_plate: 1, petite_batterie: 1, lampe_frontale: 1, batterie_voiture: 1 });
  const id = t.construire("banc_recharge", 60);
  t.utiliser(id, "recharger");
  t.attendre(30);
  const c = t.dernier("charges")!.charges;
  assert.equal(Math.round(c.petite_batterie!), 50);
  // 10 Wh entrés dans la petite batterie → ≈ 11,8 Wh pris à la batterie de voiture
  assert.equal(Math.round(c.batterie_voiture!), 168);
});

test("⚡ la lampe frontale vide la petite batterie, puis s'éteint", () => {
  const t = monter("voltaiques", { petite_batterie: 1, lampe_frontale: 1 });
  t.joueur.recevoir({ t: "lumiere", allumee: true });
  assert.equal(t.dernier("lumiere")!.allumee, true);
  // 40 Wh à 3 W : un peu plus de 13 heures de jeu (13 min réelles)
  t.attendre(13 * 60, 2);
  assert.equal(t.dernier("lumiere")!.allumee, true);
  t.attendre(60, 2);
  assert.equal(t.dernier("lumiere")!.allumee, false);
  assert.match(t.infos().join(" "), /batterie est vide/);
  t.joueur.recevoir({ t: "lumiere", allumee: true });
  assert.match(t.infos().at(-1)!, /recharge-la/);
});

test("les recettes d'une autre famille sont inconnues", () => {
  const t = monter("charbonniers", { cadre_velo: 1, chaine_velo: 1, roue_velo: 1, buche: 2, cle_plate: 1, couteau: 1, pierre: 1 });
  t.joueur.recevoir({ t: "fabriquer", recette: "pedalier", x: 20, z: 21.8, o: 0 });
  assert.match(t.infos().at(-1)!, /ne connais pas/);
  t.joueur.recevoir({ t: "fabriquer", recette: "banc_recharge", x: 20, z: 21.8, o: 0 });
  assert.match(t.infos().at(-1)!, /ne connais pas/);
});

test("la batterie de voiture de la ruine est trouvée à moitié pleine", () => {
  const t = monter("voltaiques", { cle_plate: 1, couteau: 1 });
  const batterie = t.joueur.bienvenue(0).ressources.find((r) => r.type === "batterie_voiture")!;
  t.joueur.position = { x: batterie.x, z: batterie.z + 0.6, o: 0 };
  t.joueur.recevoir({ t: "interagir", cible: { genre: "ressource", id: batterie.id }, verbe: "ramasser" });
  t.attendre(4);
  assert.equal(t.dernier("inventaire")!.inventaire.batterie_voiture, 1);
  assert.equal(t.dernier("charges")!.charges.batterie_voiture, CHARGE_TROUVEE.batterie_voiture);
});
