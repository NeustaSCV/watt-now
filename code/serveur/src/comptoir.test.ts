// Tests du lot 1 de l'É4 : la route du Carrefour, le guichet, les wotts (Book 07, Book 21 §3.7).

import { test } from "node:test";
import assert from "node:assert/strict";
import { CHARGE_TROUVEE } from "../../commun/src/energie.ts";
import { REGLAGES } from "../../commun/src/reglages.ts";
import { STOCK_DE_BASE, ajouterWotts, prixAchat, prixVente, valeurWotts } from "../../commun/src/economie.ts";
import { COMPTOIR, DUREE_VOYAGE_S, SORTIES_STATION, SORTIE_TERRAIN } from "../../commun/src/lieux.ts";
import type { MessageServeur, OperationComptoir } from "../../commun/src/messages.ts";
import type { Famille } from "../../commun/src/regles.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

function monter(inventaire: Record<string, number>, famille: Famille = "voltaiques") {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", famille);
  base.sauverInventaire(compte.id, inventaire);
  // Les primes des quêtes (Book 22) faussent les comptes : ici, elles sont déjà touchées.
  base.sauverQuetes(compte.id, { faits: {}, finies: ["comptoir"], primes: 0 });
  let instant = 1_000_000;
  const halte = new Halte(base, () => 0.5);
  halte.eteints = [];
  const comptoir = new Comptoir(base, instant);
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, halte, () => 1, comptoir);
  const attendre = (secondes: number, pas = 0.5) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      halte.tick(instant, pas);
      joueur.tick(pas);
    }
  };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  /** Du terrain jusqu'au guichet : la station, puis la route du Carrefour. */
  const allerAuGuichet = () => {
    joueur.position = { x: SORTIE_TERRAIN.boite.x, z: SORTIE_TERRAIN.boite.z, o: 0 };
    joueur.recevoir({ t: "voyager", vers: "comptoir" });
    attendre(DUREE_VOYAGE_S + 0.5);
    const est = SORTIES_STATION[1]!;
    joueur.position = { x: est.boite.x, z: est.boite.z, o: 0 };
    joueur.recevoir({ t: "voyager", vers: "comptoir" });
    attendre(DUREE_VOYAGE_S + 0.5);
    joueur.position = { x: COMPTOIR.guichet.x, z: COMPTOIR.guichet.z + 0.8, o: Math.PI };
  };
  const operer = (op: OperationComptoir) => joueur.recevoir({ t: "comptoir", op });
  const avancerTemps = (ms: number) => (instant += ms);
  return { base, joueur, comptoir, attendre, dernier, infos, allerAuGuichet, operer, recus, avancerTemps };
}

test("la route du Carrefour passe par la station-service, qu'il faut traverser", () => {
  const t = monter({});
  t.joueur.position = { x: SORTIE_TERRAIN.boite.x, z: SORTIE_TERRAIN.boite.z, o: 0 };
  t.joueur.recevoir({ t: "voyager", vers: "comptoir" });
  assert.match(t.infos().at(-1)!, /traverser/);
  t.attendre(DUREE_VOYAGE_S + 0.5);
  assert.equal(t.dernier("bienvenue")!.lieu, "station");
  t.allerAuGuichet();
  const b = t.dernier("bienvenue")!;
  assert.equal(b.lieu, "comptoir");
  assert.ok(b.comptoir && (b.comptoir.stock.conserve ?? 0) > 0);
  assert.equal(b.eteints.length, 0, "zone neutre : pas d'Éteints");
  assert.equal(b.ressources.length, 0, "rien à ramasser sur l'esplanade");
});

test("vendre des bûches remplit la poche et vide la trésorerie ; acheter fait l'inverse", () => {
  const t = monter({ buche: 4 });
  t.allerAuGuichet();
  const avant = t.comptoir.tresorerie;
  t.operer({ genre: "vendre", objet: "buche", quantite: 4 });
  const gain = prixAchat("buche", false)! * 4;
  assert.equal(t.dernier("wotts")!.wotts.poche, gain);
  assert.equal(t.comptoir.tresorerie, avant - gain);
  // Le filet du bois (plan 0.8, B13) : 10 bûches en stock de base, plus les 4 vendues.
  assert.equal(t.comptoir.stock.buche, STOCK_DE_BASE.buche! + 4);

  // Pas assez de bons pour une petite batterie…
  t.operer({ genre: "acheter", objet: "petite_batterie", quantite: 1 });
  assert.match(t.infos().at(-1)!, /Il te faut/);
  // … mais assez pour des chiffons.
  t.operer({ genre: "acheter", objet: "chiffons", quantite: 2 });
  assert.equal(t.dernier("inventaire")!.inventaire.chiffons, 2);
  assert.equal(Math.round(t.dernier("wotts")!.wotts.poche * 10) / 10, Math.round((gain - 2 * prixVente("chiffons")) * 10) / 10);
});

test("déposer une batterie crée des wotts (0,85 par Wh au printemps) ; retirer en détruit (1 par Wh)", () => {
  const t = monter({ batterie_voiture: 1 });
  t.allerAuGuichet();
  const tresorerie = t.comptoir.tresorerie;
  const reserve = t.comptoir.reserveWh;
  t.operer({ genre: "deposer", batterie: "batterie_voiture" });
  const cree = CHARGE_TROUVEE.batterie_voiture * REGLAGES.depot_wotts_par_wh;
  assert.equal(t.dernier("wotts")!.wotts.poche, cree);
  assert.equal(t.comptoir.tresorerie, tresorerie, "la trésorerie ne bouge pas : ce sont des wotts neufs");
  assert.equal(t.comptoir.reserveWh, reserve + CHARGE_TROUVEE.batterie_voiture);
  assert.equal(t.dernier("charges")!.charges.batterie_voiture, 0);

  t.operer({ genre: "retirer", batterie: "batterie_voiture" });
  // On rachète tout ce que les bons permettent : 153 Wh.
  assert.equal(Math.round(t.dernier("charges")!.charges.batterie_voiture!), Math.round(cree));
  assert.equal(t.dernier("wotts")!.wotts.poche, 0);
});

test("le compte met les bons à l'abri ; les wotts se déchargent d'≈ 2 % par semaine", () => {
  const t = monter({ buche: 10 });
  t.allerAuGuichet();
  t.operer({ genre: "vendre", objet: "buche", quantite: 10 });
  const poche = t.dernier("wotts")!.wotts.poche;
  t.operer({ genre: "verser", montant: 100 });
  assert.deepEqual(t.dernier("wotts")!.wotts, { poche: Math.round((poche - 100) * 10) / 10, compte: 100 });
  const w = ajouterWotts({ valeur: 0, majLe: 0 }, 100, 0);
  assert.equal(Math.round(valeurWotts(w, 7 * 24 * 3_600_000) * 10) / 10, 98);
});

test("pédaler pour les Compteurs paie le Wh_m (60 wotts l'heure ; 78 pour un Mécaniste)", () => {
  const t = monter({}, "mecanistes");
  t.allerAuGuichet();
  t.joueur.position = { x: COMPTOIR.pedalier.x, z: COMPTOIR.pedalier.z + 0.8, o: Math.PI };
  t.joueur.recevoir({ t: "interagir", cible: { genre: "comptoir" }, verbe: "pedaler_comptoir" });
  t.attendre(61);
  assert.equal(t.dernier("wotts")!.wotts.poche, 78);
});

test("un nouveau joueur apporte sa dotation à la trésorerie", () => {
  const t = monter({});
  const avant = t.comptoir.tresorerie;
  t.base.creerCompte("Malo", "potager42", "charbonniers");
  t.comptoir.doter();
  assert.equal(t.comptoir.tresorerie, avant + 1000);
});

test("un client modifié ne peut pas vendre « toString » ni casser la trésorerie commune (0.1.1)", () => {
  const t = monter({ buche: 2 });
  t.allerAuGuichet();
  const avant = t.comptoir.tresorerie;
  // Même en passant le contrôle des messages (appel direct), le guichet refuse.
  for (const objet of ["toString", "constructor", "__proto__", "valueOf"]) {
    t.operer({ genre: "vendre", objet, quantite: 1 } as unknown as OperationComptoir);
    t.operer({ genre: "acheter", objet, quantite: 1 } as unknown as OperationComptoir);
  }
  t.operer({ genre: "vendre", objet: "buche", quantite: Number.NaN });
  assert.equal(t.comptoir.tresorerie, avant);
  assert.ok(Number.isFinite(t.comptoir.tresorerie));
  assert.equal(t.comptoir.payer(Number.NaN), false);
  assert.equal(t.comptoir.payer(-5), false);
});
