// H2A, la route du pont (plan 0.10, chantier H) : le modèle importé (sa zone, ses Éteints, son contenu), le péage (12
// wotts, la porte ouverte pour le payeur seul, une heure), la marée (la même pour tous ; les bancs de la cale ne se
// fouillent qu'à marée basse ; qui reste sur la cale remonte sur le quai), et le voyage terrain → pont → hôtel.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { avancer } from "../../commun/src/deplacement.ts";
import { DUREE_VOYAGE_S, SORTIE_TERRAIN, arriveeDans, etapeVers, heurte, sortiesDe, zoneDe, type LieuId, type Zone } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { DUREE_PASSAGE_MS, TEXTES_PEAGE } from "../../commun/src/peage.ts";
import { eteintsRoutePont } from "../../commun/src/eteints-route-pont.ts";
import {
  BUTIN_ROUTE_PONT,
  CAISSE_PEAGE,
  CALE,
  DUREE_MAREE_MS,
  LIGNE_BANC_SOUS_L_EAU,
  LIGNE_MAREE_MONTE,
  PORTE_PEAGE,
  RETOUR_MAREE,
  ROUTE_PONT,
  estBancDeLaCale,
  marchable,
  maree,
  semerRoutePont,
  surLaCale,
  texteEchelle,
  zoneRoutePont,
} from "../../commun/src/route-pont.ts";
import { EMPRISE_RESSOURCE, USAGES } from "../../commun/src/terrain.ts";
import { etapeButin, tirerVestiges, LIEU_DE_FOUILLE } from "../../commun/src/vestiges.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Cooperatives } from "./cooperative.ts";
import { Gue } from "./gue.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { rendreSilencieux } from "./journal.ts";
import { LieuxVivants } from "./lieux-vivants.ts";
import { Moulins } from "./moulin.ts";
import { RoutePont } from "./route-pont.ts";

rendreSilencieux(true);

/** Un monde en mémoire ; `decalage` : où l'on commence, après le début du monde (0 : à marée basse, au début). */
function monde(decalage = 60_000) {
  const base = new Base(":memory:");
  let instant = base.debutMonde() + decalage;
  const maintenant = () => instant;
  const halte = new Halte(base);
  const gue = new Gue(base);
  const cooperatives = new Cooperatives(base, Math.random, maintenant);
  const moulins = new Moulins(base, Math.random, maintenant);
  const lieux = new LieuxVivants(base, { station: halte, cooperative: cooperatives, gue, moulin: moulins }, Math.random, maintenant);
  const tous: (() => void)[] = [];
  const nouveau = (pseudo: string, sac: Record<string, number> = {}) => {
    const c = base.creerCompte(pseudo, "potager42", "mecanistes");
    base.sauverInventaire(c.id, { sac_a_dos: 1, ...sac });
    const recus: MessageServeur[] = [];
    const joueur = new Joueur({ id: c.id, pseudo, famille: "mecanistes" }, base, (m) => recus.push(m), maintenant, halte, Math.random, new Comptoir(base, instant), cooperatives, gue, moulins, lieux);
    tous.push(() => joueur.tick(0.5));
    const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
    const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
    const voyager = (vers: LieuId) => {
      const etape = etapeVers(joueur.lieu, vers);
      const s = joueur.lieu === "terrain" ? SORTIE_TERRAIN : sortiesDe(joueur.lieu).find((x) => x.vers === etape || x.aussi?.includes(etape))!;
      joueur.position = { x: s.boite.x, z: s.boite.z, o: 0 };
      joueur.recevoir({ t: "voyager", vers });
      attendre(DUREE_VOYAGE_S + 0.5);
    };
    return { joueur, recus, dernier, infos, voyager, id: c.id };
  };
  const attendre = (secondes: number, pas = 0.5) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      for (const t of tous) t();
      lieux.tick(instant, pas);
    }
  };
  const pont = () => lieux.vivant("route_pont", 0) as RoutePont;
  return { base, lieux, nouveau, attendre, pont, avancer: (ms: number) => (instant += ms), instant: () => instant };
}

/** Peut-on aller de a à b dans cette zone (des pas de 0,5 m, le rayon d'un personnage) ? */
function relies(zone: Zone, a: { x: number; z: number }, b: { x: number; z: number }): boolean {
  const nx = ROUTE_PONT.longueur * 2;
  const nz = ROUTE_PONT.largeur * 2;
  const vu = new Uint8Array(nx * nz);
  const libre = (i: number, j: number) => i > 0 && j > 0 && i < nx - 1 && j < nz - 1 && !heurte(zone, i / 2 + 0.25, j / 2 + 0.25, 0.3);
  const k0 = Math.floor(a.x * 2) * nz + Math.floor(a.z * 2);
  const cible = Math.floor(b.x * 2) * nz + Math.floor(b.z * 2);
  const pile = [k0];
  vu[k0] = 1;
  while (pile.length) {
    const k = pile.pop()!;
    if (k === cible) return true;
    const i = Math.floor(k / nz);
    const j = k % nz;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const kk = (i + di) * nz + j + dj;
      if (vu[kk] || !libre(i + di, j + dj)) continue;
      vu[kk] = 1;
      pile.push(kk);
    }
  }
  return false;
}

test("les données tirées du modèle sont à jour (scripts/extraire-route-pont.mjs)", async () => {
  // @ts-expect-error : le script est en JavaScript, sans types.
  const { extraire, ecrire } = (await import("../../scripts/extraire-route-pont.mjs")) as { extraire(): Promise<unknown>; ecrire(d: unknown): string };
  const attendu = ecrire(await extraire());
  assert.equal(readFileSync(new URL("../../commun/src/route-pont-modele.ts", import.meta.url), "utf8"), attendu, "relancer node scripts/extraire-route-pont.mjs");
});

test("la zone : on traverse du terrain à l'hôtel, la porte du péage ouverte ; fermée, on ne passe pas", () => {
  const terrain = sortiesDe("route_pont").find((s) => s.vers === "terrain")!.arrivee;
  const hotel = sortiesDe("route_pont").find((s) => s.vers === "grand_hotel")!.arrivee;
  assert.ok(terrain.x < hotel.x, "le terrain à l'ouest, l'hôtel à l'est, comme sur la carte et dans le modèle");
  assert.ok(relies(zoneRoutePont({ haute: false, ouverte: true }), terrain, hotel), "porte ouverte : on passe");
  assert.ok(!relies(zoneRoutePont({ haute: false, ouverte: false }), terrain, hotel), "porte fermée : la chicane arrête");
  // En venant du terrain, on arrive contre la porte (on y paie) ; la caisse est derrière, du côté de l'hôtel.
  assert.ok(relies(zoneRoutePont({ haute: false, ouverte: false }), terrain, { x: PORTE_PEAGE.x - 1, z: PORTE_PEAGE.z }));
  assert.ok(relies(zoneRoutePont({ haute: false, ouverte: false }), hotel, { x: CAISSE_PEAGE.x - 0.9, z: CAISSE_PEAGE.z }));
  // La cale : à marée basse, on y descend du quai ; à marée haute, l'accès est fermé.
  const cale = { x: (CALE.x0 + CALE.x1) / 2, z: (CALE.z0 + CALE.z1) / 2 };
  assert.ok(relies(zoneRoutePont({ haute: false, ouverte: false }), RETOUR_MAREE, cale));
  assert.ok(!relies(zoneRoutePont({ haute: true, ouverte: false }), RETOUR_MAREE, cale));
  // La zone du lieu (lieux.ts) est celle qu'on trouve en arrivant : porte fermée, marée basse.
  assert.equal(zoneDe("route_pont"), zoneRoutePont({ haute: false, ouverte: false }));
});

test("le contenu : douze Éteints dont trois Noyés, le vrac « électrique et atelier », la bobine, les fouilles à portée", () => {
  const eteints = eteintsRoutePont();
  assert.equal(eteints.length, 12, "S-06 : ≈ 12 par halte");
  assert.equal(eteints.filter((e) => e.variante === "noye").length, 3);
  for (const e of eteints.filter((x) => x.variante === "noye")) assert.ok(surLaCale(e.x, e.z), "les Noyés sont dans la vase de la cale");
  for (const e of eteints) assert.ok(!heurte(zoneDe("route_pont"), e.x, e.z, 0.3) && (marchable(e.x, e.z) || surLaCale(e.x, e.z)), `Éteint ${e.id} (${e.x} ; ${e.z}) sur un sol où l'on marche`);
  // I14 : en vrac, pour un voyageur seul : ≈ 10 fils de cuivre, 3 résistances, 9 cellules, 8 lames, 4 barres, l'huile.
  const vrac = BUTIN_ROUTE_PONT.vrac!;
  const donne = (type: keyof typeof USAGES, objet: string) => (vrac[type] ?? 0) * ((USAGES[type].donne as Record<string, number>)[objet] ?? 0);
  assert.equal(donne("pont_cuivre", "fil_cuivre"), 10);
  assert.equal(donne("pont_resistances", "resistance"), 3);
  assert.equal(donne("pont_cellules", "cellule_lithium"), 9);
  assert.equal(donne("ressort", "ressort_lames"), 8);
  assert.equal(donne("barre_metal", "barre_metal"), 4);
  assert.equal(donne("pont_huile", "bidon_huile"), 1);
  // N2-06 : les matériaux de base des haltes.
  for (const t of ["pierre", "branche", "buche"] as const) assert.ok((vrac[t] ?? 0) > 0, t);
  // N2-57 : la bobine sur le moteur hors-bord, et sur la mobylette.
  const { ressources } = semerRoutePont();
  assert.ok(ressources.some((r) => r.type === "pont_moteur") && USAGES.pont_moteur.donne.bobine_allumage === 1);
  assert.ok(ressources.some((r) => r.type === "banc_mobylette") && USAGES.banc_mobylette.donne.bobine_allumage === 1);
  // Chaque point se touche depuis un sol où l'on marche (la portée, plus son emprise) ; les bancs depuis la cale.
  for (const r of ressources) {
    const portee = 2 + (EMPRISE_RESSOURCE[r.type] ?? 0) - 0.3;
    let ok = false;
    for (let a = 0; a < 32 && !ok; a++) for (let d = 0; d <= portee && !ok; d += 0.25) {
      const x = r.x + Math.cos((a * Math.PI) / 16) * d;
      const z = r.z + Math.sin((a * Math.PI) / 16) * d;
      ok = estBancDeLaCale(r.type) ? surLaCale(x, z) : marchable(x, z);
    }
    assert.ok(ok, `${r.type} ${r.id} (${r.x} ; ${r.z}) hors de portée`);
  }
  // Les fouilles : leur table, et l'étape H2A pour un objet-clé rare ; le fil dentaire courant à l'épicerie (N2-61).
  assert.equal(etapeButin("route_pont"), "H2A");
  assert.equal(LIEU_DE_FOUILLE.pont_epicerie, "epicerie");
  let fils = 0;
  const alea = (() => {
    let a = 7;
    return () => ((a = (a * 16807) % 2147483647) / 2147483647);
  })();
  for (let i = 0; i < 400; i++) fils += tirerVestiges("epicerie", alea).fil_dentaire ?? 0;
  assert.ok(fils >= 20, `le fil dentaire est courant à l'épicerie (${fils} en 400 fouilles)`);
  // N2-58 : aucune couverture de laine, ni lampe-tempête, dans les fouilles.
  for (const t of Object.keys(USAGES).filter((k) => k.startsWith("pont_") || k.startsWith("banc_"))) {
    const u = USAGES[t as keyof typeof USAGES];
    assert.ok(!/laine|lampe-tempête/i.test(u.examen), t);
    assert.ok(!("couvertures_laine" in u.donne) && !("lanterne_tempete" in u.donne), t);
  }
});

test("le péage : 11 wotts refusés, 12 acceptés ; la porte ne s'ouvre que pour le payeur, une heure ; on ne redemande rien", () => {
  const m = monde();
  const rose = m.nouveau("Rose", { branche: 10, chiffons: 2 });
  const malo = m.nouveau("Malo", { branche: 10 });
  for (const j of [rose, malo]) j.voyager("route_pont");
  assert.equal(rose.joueur.lieu, "route_pont");
  // En arrivant, chacun sait que sa porte est fermée.
  assert.deepEqual(rose.dernier("passage"), { t: "passage", passage: "pont", ouvert: false, du: 12 });
  // Loin de la caisse : rien.
  rose.joueur.recevoir({ t: "payer_passage", passage: "pont", objets: { branche: 4 } });
  assert.ok(rose.infos().at(-1)!.startsWith("Approche-toi de la caisse"));
  // Contre la porte, côté terrain (la caisse est derrière : la voix d'en haut entend).
  for (const j of [rose, malo]) j.joueur.position = { x: PORTE_PEAGE.x - 1, z: PORTE_PEAGE.z, o: Math.PI / 2 };
  rose.joueur.recevoir({ t: "payer_passage", passage: "pont", objets: { branche: 2, chiffons: 1 } });
  assert.equal(rose.dernier("passage")!.ouvert, false);
  assert.deepEqual(rose.joueur.bienvenue(0).inventaire, { sac_a_dos: 1, branche: 10, chiffons: 2 }, "rien n'est pris");
  rose.joueur.recevoir({ t: "payer_passage", passage: "pont", objets: { branche: 4 } });
  assert.deepEqual(rose.dernier("passage"), { t: "passage", passage: "pont", ouvert: true, du: 0 });
  assert.equal(rose.infos().at(-1), TEXTES_PEAGE.pont.paye);
  assert.equal(rose.joueur.bienvenue(0).inventaire.branche, 6);
  // La porte : ouverte pour Rose, fermée pour Malo.
  const pont = m.pont();
  assert.equal(pont.zonePour(rose.id), zoneRoutePont({ haute: false, ouverte: true }));
  assert.equal(pont.zonePour(malo.id), zoneRoutePont({ haute: false, ouverte: false }));
  // Ils marchent vers l'est, vers l'hôtel : Rose passe la porte, Malo reste devant.
  for (const j of [rose, malo]) {
    j.joueur.position = { x: PORTE_PEAGE.x - 1.2, z: PORTE_PEAGE.z, o: Math.PI / 2 };
    j.joueur.recevoir({ t: "intention", dx: 1, dz: 0, allure: "marche", seq: 1 });
  }
  m.attendre(3);
  assert.ok(rose.joueur.position.x > PORTE_PEAGE.x + 1, `Rose a passé la porte (x = ${rose.joueur.position.x})`);
  assert.ok(malo.joueur.position.x < PORTE_PEAGE.x, `Malo est resté devant (x = ${malo.joueur.position.x})`);
  for (const j of [rose, malo]) j.joueur.recevoir({ t: "intention", dx: 0, dz: 0, allure: "marche", seq: 2 });
  // Pendant l'heure, on ne redemande rien.
  rose.joueur.position = { x: CAISSE_PEAGE.x - 1, z: CAISSE_PEAGE.z, o: 0 };
  m.avancer(DUREE_PASSAGE_MS - 120_000);
  rose.joueur.recevoir({ t: "payer_passage", passage: "pont", objets: { branche: 4 } });
  assert.equal(rose.infos().at(-1), TEXTES_PEAGE.pont.dejaPaye);
  assert.equal(rose.joueur.bienvenue(0).inventaire.branche, 6);
  // L'heure passée, la porte se referme pour elle (on le lui dit).
  m.avancer(180_000);
  m.attendre(1);
  assert.equal(rose.dernier("passage")!.ouvert, false);
  assert.ok(rose.infos().includes(TEXTES_PEAGE.pont.referme));
});

test("la marée : la même pour deux joueurs ; à marée haute, les bancs de la cale ne se fouillent pas", () => {
  const m = monde(60_000);
  const rose = m.nouveau("Rose");
  const malo = m.nouveau("Malo");
  for (const j of [rose, malo]) j.voyager("route_pont");
  const debut = m.base.debutMonde();
  assert.equal(maree(m.instant(), debut), "basse");
  // Le même calcul pour tous, de l'heure du monde : deux joueurs, deux écrans, la même marée, au même instant.
  for (let k = 0; k < 6; k++) assert.equal(maree(debut + k * DUREE_MAREE_MS + 1000, debut), k % 2 === 0 ? "basse" : "haute");
  assert.match(texteEchelle(m.instant(), debut), /^Marée basse/);
  const banc = [...m.pont().ressources.values()].find((r) => r.type === "banc_trottinette")!;
  // À marée basse, sur la cale : on commence à démonter.
  rose.joueur.position = { x: banc.x - 0.8, z: banc.z, o: 0 };
  rose.joueur.recevoir({ t: "interagir", cible: { genre: "ressource", id: banc.id }, verbe: "demonter" });
  assert.ok(!rose.infos().includes(LIGNE_BANC_SOUS_L_EAU));
  rose.joueur.recevoir({ t: "annuler" });
  // À marée haute : refusé, pour l'un comme pour l'autre.
  m.avancer(DUREE_MAREE_MS);
  m.attendre(0.5);
  assert.equal(maree(m.instant(), debut), "haute");
  assert.match(texteEchelle(m.instant(), debut), /^Marée haute/);
  for (const j of [rose, malo]) {
    j.joueur.position = { x: RETOUR_MAREE.x, z: RETOUR_MAREE.z, o: 0 };
    j.joueur.recevoir({ t: "interagir", cible: { genre: "ressource", id: banc.id }, verbe: "demonter" });
    assert.equal(j.infos().at(-1), LIGNE_BANC_SOUS_L_EAU);
  }
});

test("la mer monte : qui est resté sur la cale se retrouve en haut de l'accès, avec un message fermé par un bouton", () => {
  const m = monde(DUREE_MAREE_MS - 3_000);
  const rose = m.nouveau("Rose");
  rose.voyager("route_pont");
  const cale = { x: (CALE.x0 + CALE.x1) / 2, z: (CALE.z0 + CALE.z1) / 2 + 3 };
  // Le voyage a pris du temps : on se remet juste avant la marée haute.
  const debut = m.base.debutMonde();
  while (maree(m.instant(), debut) === "haute") m.avancer(30_000);
  m.avancer(Math.max(0, DUREE_MAREE_MS - ((m.instant() - debut) % DUREE_MAREE_MS) - 2_000));
  rose.joueur.position = { x: cale.x, z: cale.z, o: 0 };
  m.attendre(1);
  assert.ok(surLaCale(rose.joueur.position.x, rose.joueur.position.z), "à marée basse, on reste sur la cale");
  m.attendre(2);
  assert.equal(maree(m.instant(), debut), "haute");
  assert.deepEqual({ x: rose.joueur.position.x, z: rose.joueur.position.z }, RETOUR_MAREE);
  assert.deepEqual(rose.dernier("maree_remonte"), { t: "maree_remonte", texte: LIGNE_MAREE_MONTE, bouton: "Compris" });
  // On ne redescend plus : l'accès est fermé.
  let p = rose.joueur.position;
  for (let i = 0; i < 30; i++) p = avancer(p, { dx: 1, dz: 0, allure: "marche" }, 0.1, m.pont().zonePour(rose.id));
  assert.ok(!surLaCale(p.x, p.z));
});

test("on voyage du terrain à l'hôtel par la route du pont, et l'on en revient", () => {
  const m = monde();
  const rose = m.nouveau("Rose");
  rose.voyager("route_pont");
  assert.equal(rose.joueur.lieu, "route_pont");
  assert.deepEqual(rose.dernier("bienvenue")!.position, arriveeDans("route_pont", "terrain"));
  assert.equal(m.pont().eteints.length, 12, "la halte a ses Éteints");
  rose.voyager("grand_hotel");
  assert.equal(rose.joueur.lieu, "grand_hotel");
  rose.voyager("route_pont");
  assert.deepEqual(rose.dernier("bienvenue")!.position, arriveeDans("route_pont", "grand_hotel"));
  rose.voyager("terrain");
  assert.equal(rose.joueur.lieu, "terrain");
});
