// Le butin de la maison, de H1A et de L1A (plan 0.8, chantier 10) : la ruine et sa caisse, le premier sac-poubelle,
// la station (la pièce de famille, le bois, la pierre, la caisse de l'atelier), la Coopérative (trois clés à place
// fixe, tout revient à 24 h), le Comptoir (les clés après une visite, le filet du bois et de la pierre), R-BUTIN.

import { test } from "node:test";
import assert from "node:assert/strict";
import { GARANTI_PREMIER_SAC, cleCouche, dispositionLieu, piecesCarreau } from "../../commun/src/couche-dechets.ts";
import { butinCoop } from "../../commun/src/cooperative.ts";
import { LIEU_DES_CLES, PRIX_CLES_L1, REASSORT_MS, STOCK_DE_BASE, prixAchat, prixVente, refusVenteCle } from "../../commun/src/economie.ts";
import { BUTIN_HALTE, genererHalte } from "../../commun/src/halte.ts";
import { COMPTOIR, DUREE_VOYAGE_S, SORTIES_STATION, SORTIE_TERRAIN } from "../../commun/src/lieux.ts";
import type { MessageServeur, OperationComptoir } from "../../commun/src/messages.ts";
import type { Famille } from "../../commun/src/regles.ts";
import { REPOUSSE_MS, USAGES, genererVestiges, ressourceVisible } from "../../commun/src/terrain.ts";
import { CLES_L1A, CLES_L1B, CLES_RARES, etapeButin, tableDeFouille, tirerCleRare, tirerVestiges } from "../../commun/src/vestiges.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Cooperatives } from "./cooperative.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

const MIN = 60_000;
const HEURE = 3_600_000;

/** Un petit monde : une halte, un Comptoir, des Coopératives, et des joueurs qu'on y fait voyager. */
function monde() {
  const base = new Base(":memory:");
  let instant = 1_000_000;
  const halte = new Halte(base, () => 0.5);
  halte.eteints = [];
  const comptoir = new Comptoir(base, instant);
  const cooperatives = new Cooperatives(base, () => 0.5, () => instant);
  const joueurs: Joueur[] = [];
  const nouveau = (pseudo: string, famille: Famille, inventaire: Record<string, number> = {}) => {
    const compte = base.creerCompte(pseudo, "potager42", famille);
    base.sauverInventaire(compte.id, { sac_a_dos: 1, couteau: 1, ...inventaire });
    base.sauverQuetes(compte.id, { faits: {}, finies: ["comptoir"], primes: 0 });
    const recus: MessageServeur[] = [];
    // Un aléa haut : aucun Éteint ne vient, aucune clé rare ne sort des fouilles.
    const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, halte, () => 0.99, comptoir, cooperatives);
    joueurs.push(joueur);
    const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
    const inv = () => dernier("inventaire")?.inventaire ?? {};
    const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
    return { compte, joueur, recus, dernier, inv, infos };
  };
  const attendre = (secondes: number, pas = 0.5) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      halte.tick(instant, pas);
      cooperatives.tick(instant, pas);
      for (const j of joueurs) j.tick(pas);
    }
  };
  const voyager = (j: Joueur, depuis: { boite: { x: number; z: number } }, vers: Parameters<Joueur["recevoir"]>[0] & { t: "voyager" }) => {
    j.position = { x: depuis.boite.x, z: depuis.boite.z, o: 0 };
    j.recevoir(vers);
    attendre(DUREE_VOYAGE_S + 0.5);
  };
  const allerALaStation = (j: Joueur) => voyager(j, SORTIE_TERRAIN, { t: "voyager", vers: "station" });
  const allerALaCoop = (j: Joueur) => {
    allerALaStation(j);
    voyager(j, SORTIES_STATION.find((s) => s.vers === "cooperative")!, { t: "voyager", vers: "cooperative" });
  };
  /** De la station au guichet du Comptoir. */
  const allerAuGuichet = (j: Joueur) => {
    voyager(j, SORTIES_STATION.find((s) => s.vers === "comptoir")!, { t: "voyager", vers: "comptoir" });
    j.position = { x: COMPTOIR.guichet.x, z: COMPTOIR.guichet.z + 0.8, o: Math.PI };
  };
  /** Prendre une ressource : on s'y place, on agit, on attend le geste. */
  const prendre = (j: Joueur, id: number, x: number, z: number, verbe: "ramasser" | "fouiller" | "demonter" = "ramasser", secondes = 8) => {
    j.position = { x, z: z + 0.9, o: Math.PI };
    j.recevoir({ t: "interagir", cible: { genre: "ressource", id }, verbe });
    attendre(secondes);
  };
  return { base, halte, comptoir, cooperatives, nouveau, attendre, allerALaStation, allerALaCoop, allerAuGuichet, prendre, sauter: (ms: number) => (instant += ms), maintenant: () => instant };
}

// ---------- La maison ----------

test("la maison : le bidon de 5 L dans la ruine, la tête de marteau dans la caisse à outils", () => {
  const ruine = genererVestiges(1);
  assert.ok(ruine.some((r) => r.type === "ruine_bidon"));
  assert.deepEqual(USAGES.ruine_bidon.donne, { bidon_5l: 1 });
  assert.equal(REPOUSSE_MS.ruine_bidon, null, "une fois, comme les autres vestiges de la ruine");
  assert.equal(USAGES.caisse_outils.donne.tete_marteau, 1);
});

test("le premier sac-poubelle du chemin donne toujours 4 sacs plastique, en plus de son tirage (2 000 terrains)", () => {
  for (let compte = 1; compte <= 2000; compte++) {
    const cle = cleCouche("terrain", compte);
    const garantis = [...dispositionLieu(cle).entries()].flatMap(([k, liste]) => liste.filter((e) => e.garanti).map((e) => ({ k, e })));
    assert.equal(garantis.length, 1, `terrain ${compte} : un seul sac garanti`);
    const { k, e } = garantis[0]!;
    assert.equal(e.genre, "sac_poubelle");
    assert.deepEqual(e.garanti, GARANTI_PREMIER_SAC);
    // Au bord du chemin d'entrée (au sud, autour de x = 25).
    assert.ok(Math.abs(e.x - 25) < 4 && e.z > 35, `terrain ${compte} : (${e.x}, ${e.z})`);
    const [cx, cz] = k.split(",").map(Number) as [number, number];
    const dedans = piecesCarreau(cle, cx, cz, 0).filter((p) => p.e === e.e && p.dedans);
    assert.ok(dedans.filter((p) => p.objet === "sac_plastique").length >= 4, `terrain ${compte}`);
  }
});

// ---------- H1A, la station ----------

test("la station : 12 bûches et 13 pierres en vrac (17 avec les pierres des prés, 0.9), qui reviennent en 30 min ; au terrain, jamais", () => {
  const ressources = genererHalte();
  assert.equal(ressources.filter((r) => r.type === "buche").length, 36, "12, et de quoi aller jusqu'à ×3");
  // Le semis d'avant (genererHalte) ; la 0.9 (M5) y ajoute 4 pierres sur les prés, à chaque tournée (semis-lieux.ts).
  assert.equal(ressources.filter((r) => r.type === "pierre").length, 39);
  assert.deepEqual(BUTIN_HALTE.vrac, { buche: 12, pierre: 17 });
  const t = monde();
  assert.equal(t.halte.delaiRepousse("buche"), 30 * MIN);
  assert.equal(t.halte.delaiRepousse("pierre"), 30 * MIN);
  assert.equal(REPOUSSE_MS.buche, null);
  assert.equal(REPOUSSE_MS.pierre, null);
  // En vrai : une bûche prise à la station revient 30 min après.
  const a = t.nouveau("Rose", "voltaiques");
  t.allerALaStation(a.joueur);
  const vues = a.dernier("bienvenue")!.ressources;
  assert.equal(vues.filter((r) => r.type === "buche" && r.disponible).length, 12, "seul : 12 bûches");
  assert.equal(vues.filter((r) => r.type === "pierre" && r.disponible).length, 17, "seul : 17 pierres");
  const buche = vues.find((r) => r.type === "buche" && r.disponible)!;
  t.prendre(a.joueur, buche.id, buche.x, buche.z, "ramasser", 4);
  assert.equal(a.inv().buche, 1);
  assert.deepEqual(a.dernier("ressource"), { t: "ressource", id: buche.id, disponible: false });
  t.attendre(29 * 60, 30);
  assert.equal(a.recus.filter((m) => m.t === "ressource" && m.id === buche.id && m.disponible).length, 0);
  t.attendre(70, 5);
  assert.equal(a.recus.filter((m) => m.t === "ressource" && m.id === buche.id && m.disponible).length, 1, "revenue au bout de 30 min");
});

test("à trois voyageurs, le vrac de la station fait ×2 ; à cinq, ×3, et pas plus", () => {
  const t = monde();
  const v = ["Rose", "Malo", "Inès", "Paul", "Lou", "Yann"].map((p) => t.nouveau(p, "mecanistes"));
  const buches = () => t.halte.vuePour(v[0]!.compte.id, "mecanistes", t.maintenant()).filter((r) => r.type === "buche" && r.disponible).length;
  t.allerALaStation(v[0]!.joueur);
  assert.equal(buches(), 12);
  t.allerALaStation(v[1]!.joueur);
  t.allerALaStation(v[2]!.joueur);
  assert.equal(buches(), 24);
  t.allerALaStation(v[3]!.joueur);
  t.allerALaStation(v[4]!.joueur);
  assert.equal(buches(), 36);
  t.allerALaStation(v[5]!.joueur);
  assert.equal(buches(), 36, "×3 au plus");
  // Le premier arrivé a vu paraître les bûches en plus.
  assert.ok(v[0]!.recus.filter((m) => m.t === "ressource" && m.disponible).length >= 24);
});

test("la pièce de famille : deux Charbonniers prennent chacun leur enclume ; un Voltaïque ne la voit pas", () => {
  const t = monde();
  const a = t.nouveau("Rose", "charbonniers");
  const b = t.nouveau("Malo", "charbonniers");
  const c = t.nouveau("Inès", "voltaiques");
  for (const j of [a, b, c]) t.allerALaStation(j.joueur);
  const enclume = a.dernier("bienvenue")!.ressources.find((r) => r.type === "piece_enclume")!;
  assert.ok(enclume && enclume.disponible);
  assert.ok(!c.dernier("bienvenue")!.ressources.some((r) => r.type === "piece_enclume"), "le Voltaïque ne la voit pas");
  assert.ok(!a.dernier("bienvenue")!.ressources.some((r) => r.type === "piece_alternateur" || r.type === "panneau_auvent"), "ni les pièces des autres");
  assert.ok(c.dernier("bienvenue")!.ressources.some((r) => r.type === "panneau_auvent"), "le Voltaïque voit son panneau");
  assert.equal(ressourceVisible("piece_alternateur", "mecanistes"), true);
  // Le Voltaïque n'y touche pas, même s'il en connaît l'identifiant.
  t.prendre(c.joueur, enclume.id, enclume.x, enclume.z);
  assert.equal(c.inv().enclume_depanneur, undefined);
  t.prendre(a.joueur, enclume.id, enclume.x, enclume.z);
  assert.equal(a.inv().enclume_depanneur, 1);
  assert.equal(a.inv().charbon_bois, 4, "et le sac de 4 charbons (I23)");
  assert.equal(b.recus.filter((m) => m.t === "ressource" && m.id === enclume.id).length, 0, "l'autre ne la voit pas partir");
  t.prendre(b.joueur, enclume.id, enclume.x, enclume.z);
  assert.equal(b.inv().enclume_depanneur, 1, "il a la sienne");
  // Reprise ? Non : elle revient pour son joueur au bout de 24 h (Q-0.8-14).
  t.prendre(a.joueur, enclume.id, enclume.x, enclume.z);
  assert.equal(a.inv().enclume_depanneur, 1);
  assert.equal(t.halte.disponiblePour(t.halte.ressources.get(enclume.id)!, a.compte.id, t.maintenant() + 23 * HEURE), false);
  assert.equal(t.halte.disponiblePour(t.halte.ressources.get(enclume.id)!, a.compte.id, t.maintenant() + 24 * HEURE), true);
});

test("le tas de bois : deux joueurs prennent chacun 10 bûches à leur tas ; celui de l'un ne bouge pas quand l'autre se sert", () => {
  const t = monde();
  const a = t.nouveau("Rose", "mecanistes");
  const b = t.nouveau("Malo", "voltaiques");
  t.allerALaStation(a.joueur);
  t.allerALaStation(b.joueur);
  const tas = a.dernier("bienvenue")!.ressources.find((r) => r.type === "tas_bois")!;
  assert.equal(tas.reste, 10);
  for (let k = 0; k < 10; k++) t.prendre(a.joueur, tas.id, tas.x, tas.z, "ramasser", 3);
  assert.equal(a.inv().buche, 10);
  assert.deepEqual(a.dernier("ressource"), { t: "ressource", id: tas.id, disponible: false, reste: 0 });
  t.prendre(a.joueur, tas.id, tas.x, tas.z, "ramasser", 3);
  assert.equal(a.inv().buche, 10, "vide pour lui");
  assert.equal(b.recus.filter((m) => m.t === "ressource" && m.id === tas.id).length, 0, "le tas de l'autre n'a pas bougé");
  assert.equal(t.halte.vuePour(b.compte.id, "voltaiques", t.maintenant()).find((r) => r.id === tas.id)!.reste, 10);
  for (let k = 0; k < 10; k++) t.prendre(b.joueur, tas.id, tas.x, tas.z, "ramasser", 3);
  assert.equal(b.inv().buche, 10);
  // Il revient en 6 h réelles (B3).
  assert.equal(REPOUSSE_MS.tas_bois, 6 * HEURE);
  t.sauter(6 * HEURE);
  t.attendre(6);
  assert.ok(a.recus.some((m) => m.t === "ressource" && m.id === tas.id && m.reste === 10));
});

test("la caisse de l'atelier garantit les clous, le fil de fer et l'huile (I1)", () => {
  const d = USAGES.caisse_atelier.donne;
  assert.equal(d.bocal_clous, 1);
  assert.equal(d.rouleau_fil_fer, 1);
  assert.equal(d.bidon_huile, 1);
  assert.ok(genererHalte().some((r) => r.type === "caisse_atelier"));
  for (const t of ["piece_enclume", "piece_alternateur", "tas_bois", "coop_grillage", "coop_cocotte"] as const) assert.ok(USAGES[t], t);
});

// ---------- L1A, la Coopérative ----------

test("à la première visite de L1A, les trois clés sont à leur place ; au bout de 24 h, tout revient", () => {
  const t = monde();
  const a = t.nouveau("Rose", "charbonniers");
  t.allerALaCoop(a.joueur);
  const coop = t.cooperatives.de(a.compte.id);
  for (const e of coop.eteints) e.etat = "detruit";
  const vues = a.dernier("bienvenue")!.ressources;
  const point = (type: string) => vues.find((r) => r.type === type)!;
  for (const type of ["coop_grillage", "coop_cocotte", "coop_caisse_froide"]) assert.ok(point(type)?.disponible, type);
  assert.ok(butinCoop().some((r) => r.type === "coop_masse"), "la masse reste (Q-0.8-5)");
  const grillage = point("coop_grillage");
  t.prendre(a.joueur, grillage.id, grillage.x, grillage.z);
  const cocotte = point("coop_cocotte");
  t.prendre(a.joueur, cocotte.id, cocotte.x, cocotte.z);
  const seau = point("coop_caisse_froide");
  t.prendre(a.joueur, seau.id, seau.x, seau.z, "fouiller", 6);
  assert.equal(a.inv().grillage_rouleau, 1);
  assert.equal(a.inv().cocotte_fonte, 1);
  assert.equal(a.inv().seau_10l, 1);
  // On s'en va ; 23 h plus tard, rien n'est revenu ; 24 h après l'arrivée, tout est là, et les Éteints aussi.
  a.joueur.partir();
  t.attendre(6 * 60, 5);
  t.sauter(23 * HEURE);
  const a23 = t.cooperatives.de(a.compte.id);
  assert.ok([grillage, cocotte, seau].every((r) => a23.ressources.get(r.id)!.disponibleLe > t.maintenant()));
  a23.sortir(a.joueur);
  t.attendre(6 * 60, 5);
  t.sauter(HEURE);
  const a24 = t.cooperatives.de(a.compte.id);
  assert.ok([grillage, cocotte, seau].every((r) => a24.ressources.get(r.id)!.disponibleLe <= t.maintenant()));
  assert.equal(a24.eteints.filter((e) => e.etat !== "detruit").length, 24);
  assert.equal(REPOUSSE_MS.coop_grillage, 24 * HEURE, "le grillage passe de 4 jours à 24 h");
});

// ---------- Le Comptoir ----------

test("le Comptoir refuse de vendre un seau avant la première visite de L1A, puis le vend, plus cher que d'aller le chercher", () => {
  const t = monde();
  const a = t.nouveau("Rose", "voltaiques");
  t.allerALaStation(a.joueur);
  t.allerAuGuichet(a.joueur);
  // Des bons en poche (un dépôt fictif : on les verse directement).
  (a.joueur as unknown as { poche: { valeur: number; majLe: number } }).poche = { valeur: 2000, majLe: t.maintenant() };
  const operer = (op: OperationComptoir) => a.joueur.recevoir({ t: "comptoir", op });
  assert.equal(t.comptoir.stock.seau_10l, 1, "en stock limité");
  operer({ genre: "acheter", objet: "seau_10l", quantite: 1 });
  assert.match(a.infos().at(-1)!, /Va d'abord voir la Coopérative du Plateau/);
  assert.equal(a.inv().seau_10l, undefined);
  assert.equal(refusVenteCle("seau_10l", { "visite:cooperative": 1 }), null);
  assert.match(refusVenteCle("etau", { "visite:cooperative": 1 })!, /le Moulin du Gué/);
  // Il a vu la Coopérative : le Comptoir le lui vend.
  (a.joueur as unknown as { quetes: { etat: { faits: Record<string, number> } } }).quetes.etat.faits["visite:cooperative"] = 1;
  operer({ genre: "acheter", objet: "seau_10l", quantite: 1 });
  assert.equal(a.inv().seau_10l, 1);
  assert.equal(t.comptoir.stock.seau_10l ?? 0, 0);
  // Le prix : deux allers-retours de travail ; il les rachète bien moins cher. Les pièces de famille ne s'y vendent pas.
  assert.equal(prixVente("seau_10l"), PRIX_CLES_L1.vente);
  assert.equal(prixAchat("seau_10l", false), PRIX_CLES_L1.rachat);
  for (const cle of [...CLES_L1A, ...CLES_L1B]) assert.ok(LIEU_DES_CLES[cle], cle);
  for (const piece of ["enclume_depanneur", "petit_alternateur", "panneau_solaire"] as const) assert.equal(prixAchat(piece, false), null, piece);
  operer({ genre: "vendre", objet: "seau_10l", quantite: 1 });
  assert.equal(t.comptoir.stock.seau_10l, 1, "il le rachète");
});

test("le Comptoir a 10 bûches et 10 pierres au démarrage, au prix de vente ; une de plus 2 h après en avoir vendu", () => {
  const t = monde();
  assert.equal(t.comptoir.stock.buche, 10);
  assert.equal(t.comptoir.stock.pierre, 10);
  assert.equal(STOCK_DE_BASE.buche, 10);
  assert.equal(prixVente("buche"), 19);
  assert.equal(prixVente("pierre"), 7);
  const a = t.nouveau("Rose", "voltaiques");
  t.allerALaStation(a.joueur);
  t.allerAuGuichet(a.joueur);
  (a.joueur as unknown as { poche: { valeur: number; majLe: number } }).poche = { valeur: 200, majLe: t.maintenant() };
  a.joueur.recevoir({ t: "comptoir", op: { genre: "acheter", objet: "buche", quantite: 3 } });
  assert.equal(a.inv().buche, 3);
  assert.equal(t.comptoir.stock.buche, 7);
  // Le réassort tourne toutes les 2 h (une unité par objet manquant) : 2 h après, une de plus ; 4 h après, deux.
  t.sauter(REASSORT_MS);
  assert.equal(t.comptoir.vue(t.maintenant()).stock.buche, 8, "une de plus, 2 h après");
  t.sauter(REASSORT_MS);
  assert.equal(t.comptoir.vue(t.maintenant()).stock.buche, 9);
});

// ---------- R-BUTIN ----------

test("R-BUTIN : une clé de L1 sort rarement d'une fouille à H1A ou dans l'autre L1, jamais à la maison", () => {
  assert.equal(etapeButin("station"), "H1A");
  assert.equal(etapeButin("cooperative"), "L1A");
  assert.equal(etapeButin("gue"), "H1B");
  assert.equal(etapeButin("moulin"), "L1B");
  assert.equal(etapeButin("terrain"), undefined);
  assert.equal(etapeButin("comptoir"), undefined);
  assert.deepEqual(CLES_RARES.L1A.cles, CLES_L1B, "à la Coopérative, les clés du Moulin");
  assert.deepEqual(CLES_RARES.L1B.cles, CLES_L1A);
  // Sur 20 000 fouilles, la chance fixée à la main tient.
  let graine = 7;
  const alea = () => ((graine = (graine * 16807) % 2147483647) - 1) / 2147483646;
  let n = 0;
  for (let i = 0; i < 20_000; i++) if (tirerCleRare("H1A", alea)) n++;
  assert.ok(Math.abs(n / 20_000 - CLES_RARES.H1A.chance) < 0.006, `${n}`);
  // Elle s'ajoute à la fouille, hors des tables courantes.
  const trouve = tirerVestiges("libre_service", () => 0, "L1A");
  assert.ok(CLES_L1B.some((c) => trouve[c] === 1));
  assert.ok(!tableDeFouille("libre_service").some(([t]) => CLES_L1B.includes(t)));
  assert.equal(Object.keys(tirerVestiges("atelier", () => 0)).some((t) => [...CLES_L1A, ...CLES_L1B].includes(t as never)), false, "sans étape (la caisse de la ruine) : jamais");
});
