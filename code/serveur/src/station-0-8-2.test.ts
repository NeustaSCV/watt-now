// La station de la 0.8.2 (plan 0.8.2, chantier D) : la caisse de l'atelier personnelle, le dormant loin des établis,
// le tas de bois et le stock du Comptoir en réglages à chaud, et une partie 0.8.1 qui se relit.

import { test } from "node:test";
import assert from "node:assert/strict";
import { STOCK_DE_BASE } from "../../commun/src/economie.ts";
import { BUTIN_HALTE, VERSION_HALTE, eteintsHalte, genererHalte } from "../../commun/src/halte.ts";
import { COMPTOIR, DUREE_VOYAGE_S, GARAGE, SORTIES_STATION, SORTIE_TERRAIN } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { appliquerReglages } from "../../commun/src/reglages.ts";
import type { Famille } from "../../commun/src/regles.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Cooperatives } from "./cooperative.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

const HEURE = 3_600_000;

/** Un petit monde : une halte, un Comptoir, et des joueurs qu'on y fait voyager (une base donnée : une partie d'avant). */
function monde(base = new Base(":memory:")) {
  let instant = 1_000_000;
  const halte = new Halte(base, () => 0.5);
  halte.eteints = [];
  const comptoir = new Comptoir(base, instant);
  const cooperatives = new Cooperatives(base, () => 0.5, () => instant);
  const joueurs: Joueur[] = [];
  const nouveau = (pseudo: string, famille: Famille) => {
    const compte = base.creerCompte(pseudo, "potager42", famille);
    base.sauverInventaire(compte.id, { sac_a_dos: 1, couteau: 1 });
    base.sauverQuetes(compte.id, { faits: {}, finies: ["comptoir"], primes: 0 });
    const recus: MessageServeur[] = [];
    const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, halte, () => 0.99, comptoir, cooperatives);
    joueurs.push(joueur);
    const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
    const inv = () => dernier("inventaire")?.inventaire ?? {};
    return { compte, joueur, recus, dernier, inv };
  };
  const attendre = (secondes: number, pas = 0.5) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      halte.tick(instant, pas);
      for (const j of joueurs) j.tick(pas);
    }
  };
  const voyager = (j: Joueur, depuis: { boite: { x: number; z: number } }, vers: "station" | "terrain" | "comptoir") => {
    j.position = { x: depuis.boite.x, z: depuis.boite.z, o: 0 };
    j.recevoir({ t: "voyager", vers });
    attendre(DUREE_VOYAGE_S + 0.5);
  };
  const allerALaStation = (j: Joueur) => voyager(j, SORTIE_TERRAIN, "station");
  const rentrer = (j: Joueur) => voyager(j, SORTIES_STATION.find((s) => s.vers === "terrain")!, "terrain");
  const prendre = (j: Joueur, id: number, x: number, z: number, verbe: "ramasser" | "fouiller", secondes: number) => {
    j.position = { x, z: z + 0.9, o: Math.PI };
    j.recevoir({ t: "interagir", cible: { genre: "ressource", id }, verbe });
    attendre(secondes);
  };
  return { base, halte, comptoir, nouveau, attendre, allerALaStation, rentrer, prendre, sauter: (ms: number) => (instant += ms), maintenant: () => instant };
}

test("la caisse de l'atelier : deux joueurs prennent chacun les clous, le fil de fer et l'huile", () => {
  const t = monde();
  const a = t.nouveau("Rose", "charbonniers");
  const b = t.nouveau("Malo", "mecanistes");
  t.allerALaStation(a.joueur);
  t.allerALaStation(b.joueur);
  const caisse = a.dernier("bienvenue")!.ressources.find((r) => r.type === "caisse_atelier")!;
  assert.ok(caisse.disponible);
  // La fouille garantit les trois (I1, I2), en plus de son tirage.
  const garantis = ["bocal_clous", "rouleau_fil_fer", "bidon_huile"] as const;
  t.prendre(a.joueur, caisse.id, caisse.x, caisse.z, "fouiller", 10);
  for (const o of garantis) assert.ok((a.inv()[o] ?? 0) >= 1, o);
  assert.equal(b.recus.filter((m) => m.t === "ressource" && m.id === caisse.id).length, 0, "l'autre ne la voit pas se vider");
  t.prendre(b.joueur, caisse.id, caisse.x, caisse.z, "fouiller", 10);
  for (const o of garantis) assert.ok((b.inv()[o] ?? 0) >= 1, `il a les siens : ${o}`);
  // Vide pour Rose, jusqu'à son retour (12 h, comme avant).
  const avant = { ...a.inv() };
  t.prendre(a.joueur, caisse.id, caisse.x, caisse.z, "fouiller", 10);
  assert.deepEqual(a.inv(), avant, "rien de plus");
  const r = t.halte.ressources.get(caisse.id)!;
  assert.equal(t.halte.disponiblePour(r, a.compte.id, t.maintenant() + 11 * HEURE), false);
  assert.equal(t.halte.disponiblePour(r, a.compte.id, t.maintenant() + 12 * HEURE), true);
  assert.equal(BUTIN_HALTE.personnel!.caisse_atelier, 1);
});

test("le dormant de l'atelier dort à plus de 4 m des établis et de la caisse, hors de leur chemin depuis la route", () => {
  const caisse = genererHalte().find((r) => r.type === "caisse_atelier")!;
  const etablis = [GARAGE.etabliBois, GARAGE.etabliVoiture, caisse];
  for (const e of eteintsHalte().filter((x) => x.etat === "dormant")) {
    for (const p of etablis) assert.ok(Math.hypot(e.x - p.x, e.z - p.z) > 4, `dormant ${e.id} à ${Math.hypot(e.x - p.x, e.z - p.z).toFixed(2)} m de (${p.x}, ${p.z})`);
  }
  // On vient de la route (z = 35) tout droit vers chaque établi : aucun dormant à moins de 3 m de ce chemin.
  for (const p of etablis) {
    for (const e of eteintsHalte().filter((x) => x.etat === "dormant")) {
      if (e.z < p.z || e.z > 35) continue;
      assert.ok(Math.abs(e.x - p.x) > 3, `dormant ${e.id} sur le chemin de (${p.x}, ${p.z})`);
    }
  }
});

test("un réglage changé à chaud change le tas de bois à la visite suivante, et son délai de retour", () => {
  try {
    const t = monde();
    const a = t.nouveau("Rose", "voltaiques");
    t.allerALaStation(a.joueur);
    const tas = a.dernier("bienvenue")!.ressources.find((r) => r.type === "tas_bois")!;
    assert.equal(tas.reste, 10, "10 par défaut (B3)");
    t.rentrer(a.joueur);
    appliquerReglages({ tas_bois_buches: 14, tas_bois_retour_h: 2 });
    t.allerALaStation(a.joueur);
    const tas2 = a.dernier("bienvenue")!.ressources.find((r) => r.type === "tas_bois")!;
    assert.equal(tas2.reste, 14, "le nouveau réglage, dès la visite suivante");
    t.prendre(a.joueur, tas2.id, tas2.x, tas2.z, "ramasser", 3);
    assert.equal(a.inv().buche, 1);
    const r = t.halte.ressources.get(tas2.id)!;
    assert.equal(t.halte.vuePour(a.compte.id, "voltaiques", t.maintenant()).find((x) => x.id === tas2.id)!.reste, 13);
    assert.equal(t.halte.delaiRepousse("tas_bois"), 2 * HEURE);
    assert.equal(t.halte.disponiblePour(r, a.compte.id, t.maintenant() + 2 * HEURE), true);
    assert.equal(t.halte.vuePour(a.compte.id, "voltaiques", t.maintenant() + 2 * HEURE).find((x) => x.id === tas2.id)!.reste, 14, "revenu en 2 h");
  } finally {
    appliquerReglages({});
  }
  assert.equal(BUTIN_HALTE.personnel!.tas_bois, 10, "retour au défaut");
  assert.equal(BUTIN_HALTE.repousse!.tas_bois, 6 * HEURE);
});

test("un réglage changé à chaud change le stock du Comptoir : le réassort remonte au nouveau niveau, à son rythme", () => {
  try {
    const t = monde();
    assert.equal(t.comptoir.stock.buche, 10);
    assert.equal(t.comptoir.stock.pierre, 10);
    appliquerReglages({ comptoir_buches: 13, comptoir_pierres: 4, comptoir_reassort_h: 0.5 });
    assert.equal(STOCK_DE_BASE.buche, 13);
    // Trois réassorts d'une demi-heure : trois bûches de plus ; les pierres au-dessus du niveau ne bougent pas.
    t.sauter(1.5 * HEURE);
    const vue = t.comptoir.vue(t.maintenant());
    assert.equal(vue.stock.buche, 13);
    assert.equal(vue.stock.pierre, 10, "rien n'est retiré au-dessus du niveau");
    // On en achète ; une demi-heure plus tard, une de plus.
    const a = t.nouveau("Rose", "voltaiques");
    t.allerALaStation(a.joueur);
    a.joueur.position = { x: SORTIES_STATION.find((s) => s.vers === "comptoir")!.boite.x, z: SORTIES_STATION.find((s) => s.vers === "comptoir")!.boite.z, o: 0 };
    a.joueur.recevoir({ t: "voyager", vers: "comptoir" });
    t.attendre(DUREE_VOYAGE_S + 0.5);
    a.joueur.position = { x: COMPTOIR.guichet.x, z: COMPTOIR.guichet.z + 0.8, o: Math.PI };
    (a.joueur as unknown as { poche: { valeur: number; majLe: number } }).poche = { valeur: 500, majLe: t.maintenant() };
    a.joueur.recevoir({ t: "comptoir", op: { genre: "acheter", objet: "buche", quantite: 5 } });
    assert.equal(a.inv().buche, 5);
    t.sauter(0.5 * HEURE);
    assert.equal(t.comptoir.vue(t.maintenant()).stock.buche, 9);
  } finally {
    appliquerReglages({});
  }
  assert.equal(STOCK_DE_BASE.buche, 10, "retour au défaut");
});

test("une partie 0.8.1 se relit : la caisse prise en commun revient pour tous, le tas entamé reste entamé", () => {
  const base = new Base(":memory:");
  // La 0.8.1 : la station déjà générée, la caisse prise par quelqu'un (partagée, 12 h), un tas entamé par Rose.
  const avant = monde(base);
  const rose = avant.nouveau("Rose", "charbonniers");
  const caisse = genererHalte().find((r) => r.type === "caisse_atelier")!;
  const tas = genererHalte().find((r) => r.type === "tas_bois")!;
  base.sauverRessourceLieu("station", caisse.id, avant.maintenant() + 10 * HEURE);
  base.sauverInstance(`perso:station:${rose.compte.id}`, { version: VERSION_HALTE, etats: { [tas.id]: { reste: 6, revientLe: avant.maintenant() + 5 * HEURE } } }, avant.maintenant());
  // La 0.8.2 démarre sur la même base.
  const t = monde(base);
  const vue = t.halte.vuePour(rose.compte.id, "charbonniers", t.maintenant());
  assert.equal(vue.find((x) => x.id === caisse.id)!.disponible, true, "la caisse est à elle, pleine");
  assert.equal(vue.find((x) => x.id === tas.id)!.reste, 6, "son tas entamé l'est toujours");
  // Le délai partagé d'avant passe sans rien annoncer à personne.
  const malo = t.nouveau("Malo", "mecanistes");
  t.allerALaStation(malo.joueur);
  t.prendre(malo.joueur, caisse.id, caisse.x, caisse.z, "fouiller", 10);
  assert.ok((malo.inv().bocal_clous ?? 0) >= 1, "Malo fouille la sienne");
  t.sauter(10 * HEURE);
  t.attendre(6);
  assert.equal(malo.recus.filter((m) => m.t === "ressource" && m.id === caisse.id && m.disponible).length, 0, "sa caisse ne revient pas avant 12 h");
});
