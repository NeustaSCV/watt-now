// La couche de déchets côté serveur (0.7, chantier 2) : ramasser, fouiller, démonter, renouveler, effacer les ordures.

import { test } from "node:test";
import assert from "node:assert/strict";
import { POINTS_LIEUX, cleCouche, dispositionLieu, placePoint, refConteneur } from "../../commun/src/couche-dechets.ts";
import { DUREE_ORDURE_JETEE_MS, RENOUVELLEMENT_MS } from "../../commun/src/dechets.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { messageValide } from "./controle.ts";
import { BALISE_LUMIERE_NUIT, CoucheDechets, registreDechets } from "./couche-dechets.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import type { LieuVivant } from "./lieu-vivant.ts";
import type { Stimulus } from "../../commun/src/signature.ts";
import { estNuit, heureDeJeu } from "../../commun/src/temps.ts";

function monter(lieu: "terrain" | "station", inventaire: Record<string, number> = { sac_a_dos: 1 }, base = new Base(":memory:"), halte?: Halte) {
  const compte = base.creerCompte(`Rose${Math.floor(Math.random() * 1e6)}`, "potager42", "mecanistes");
  base.sauverInventaire(compte.id, inventaire);
  base.sauverQuetes(compte.id, { faits: {}, finies: ["comptoir"], primes: 0 });
  if (lieu === "station") base.sauverPosition(compte.id, { x: 190, z: 35, o: 0 }, "station");
  const h = halte ?? new Halte(base, () => 0.5);
  h.eteints = [];
  const horloge = { instant: 1_000_000 };
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => horloge.instant, h, () => 0.9, new Comptoir(base, horloge.instant));
  const attendre = (secondes: number, pas = 0.5) => {
    for (let s = 0; s < secondes; s += pas) {
      horloge.instant += pas * 1000;
      h.tick(horloge.instant, pas);
      joueur.tick(pas);
    }
  };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  return { base, compte, joueur, horloge, attendre, dernier, infos, recus, halte: h };
}

/** Une pièce au sol (pas dans un conteneur) d'une couche, et son carreau. */
function unePiece(base: Base, cle: string, filtre: (objet: string) => boolean = () => true) {
  const couche = registreDechets(base).couche(cle);
  for (const k of dispositionLieu(cle).keys()) {
    const [cx, cz] = k.split(",").map(Number) as [number, number];
    const p = couche.pieces(cx, cz).find((x) => !x.dedans && filtre(x.objet));
    if (p) return { cx, cz, p };
  }
  throw new Error("aucune pièce");
}

/** Un conteneur d'une couche (son carreau, son emplacement). */
function unConteneur(cle: string) {
  for (const [k, l] of dispositionLieu(cle)) {
    const e = l.find((x) => x.genre !== "sol");
    if (e) {
      const [cx, cz] = k.split(",").map(Number) as [number, number];
      return { cx, cz, e };
    }
  }
  throw new Error("aucun conteneur");
}

test("la bienvenue apporte la couche du lieu : sa clé, les carreaux entamés, les points (≈ 1 Ko)", () => {
  const t = monter("station");
  t.joueur.recevoir({ t: "ping", envoye: 0 });
  const b = t.joueur.bienvenue(0);
  assert.equal(b.dechets?.cle, "station");
  assert.deepEqual(b.dechets?.carreaux, []);
  assert.equal(b.dechets?.points.length, POINTS_LIEUX.station!.length);
  assert.ok(JSON.stringify(b.dechets).length < 1200, `${JSON.stringify(b.dechets).length} octets`);
});

test("ramasser une pièce sur son terrain : une seconde, dans le sac, et elle ne revient pas", () => {
  const t = monter("terrain");
  const cle = cleCouche("terrain", t.compte.id);
  const { cx, cz, p } = unePiece(t.base, cle);
  t.joueur.position = { x: p.x, z: p.z + 0.5, o: 0 };
  t.joueur.recevoir({ t: "dechets", op: { genre: "ramasser", cx, cz, i: p.i } });
  t.attendre(1.5);
  assert.equal(t.dernier("inventaire")!.inventaire[p.objet], 1);
  assert.deepEqual(t.dernier("dechets_carreau"), { t: "dechets_carreau", cx, cz, r: 0, pris: [p.i] });
  // Gardé en base, sans renouvellement (Q4) : même des semaines plus tard.
  const ligne = t.base.chargerDechets(cle).find((l) => l.carreau === `${cx},${cz}`)!;
  assert.deepEqual(ligne, { carreau: `${cx},${cz}`, remplissage: 0, pris: [p.i], renouveleLe: 0 });
  t.horloge.instant += 30 * 24 * 3_600_000;
  t.attendre(6);
  assert.deepEqual(t.joueur.bienvenue(0).dechets!.carreaux, [[cx, cz, 0, [p.i]]]);
  // Déjà ramassée : rien ne se passe.
  t.joueur.recevoir({ t: "dechets", op: { genre: "ramasser", cx, cz, i: p.i } });
  t.attendre(1.5);
  assert.equal(t.dernier("inventaire")!.inventaire[p.objet], 1);
});

test("trop loin, ou le sac plein : on ne ramasse pas", () => {
  const t = monter("terrain", { sac_a_dos: 1, pierre: 30 });
  const { cx, cz, p } = unePiece(t.base, cleCouche("terrain", t.compte.id));
  t.joueur.position = { x: p.x + 6, z: p.z, o: 0 };
  t.joueur.recevoir({ t: "dechets", op: { genre: "ramasser", cx, cz, i: p.i } });
  assert.match(t.infos().at(-1)!, /trop loin/);
  t.joueur.position = { x: p.x, z: p.z, o: 0 };
  t.joueur.recevoir({ t: "dechets", op: { genre: "ramasser", cx, cz, i: p.i } });
  assert.match(t.infos().at(-1)!, /trop lourd/);
});

test("à la halte, un carreau entamé se remplit à nouveau (8 à 24 h), d'un tirage neuf, pour tous les présents", () => {
  const base = new Base(":memory:");
  const a = monter("station", { sac_a_dos: 1 }, base);
  const b = monter("station", { sac_a_dos: 1 }, base, a.halte);
  const { cx, cz, p } = unePiece(base, "station");
  a.joueur.position = { x: p.x, z: p.z, o: 0 };
  a.joueur.recevoir({ t: "dechets", op: { genre: "ramasser", cx, cz, i: p.i } });
  a.attendre(1.5);
  // L'autre voyageur voit la pièce disparaître.
  assert.deepEqual(b.dernier("dechets_carreau")?.pris, [p.i]);
  const renouv = base.chargerDechets("station")[0]!.renouveleLe;
  assert.ok(renouv - a.horloge.instant >= RENOUVELLEMENT_MS.min - 2000 && renouv - a.horloge.instant <= RENOUVELLEMENT_MS.max, "8 à 24 h");
  a.horloge.instant = renouv + 1000;
  a.attendre(6);
  assert.deepEqual(b.dernier("dechets_carreau"), { t: "dechets_carreau", cx, cz, r: 1, pris: [] });
  assert.equal(base.chargerDechets("station")[0]!.remplissage, 1);
});

test("fouiller un sac-poubelle : 4 à 8 s, une liste au choix ; ce qu'on laisse reste dedans", () => {
  const t = monter("terrain");
  const cle = cleCouche("terrain", t.compte.id);
  const { cx, cz, e } = unConteneur(cle);
  const ref = refConteneur(cx, cz, e.e);
  // Prendre sans avoir fouillé : refusé sans bruit.
  t.joueur.recevoir({ t: "dechets", op: { genre: "prendre", ref, i: 0 } });
  t.joueur.position = { x: e.x, z: e.z + 1, o: 0 };
  t.joueur.recevoir({ t: "dechets", op: { genre: "fouiller", ref } });
  const debut = t.dernier("action")!;
  assert.ok(debut.etat === "debut" && debut.duree >= 4 && debut.duree <= 8);
  t.attendre(6);
  const liste = t.dernier("fouille")!.fouille!;
  assert.equal(liste.ref, ref);
  assert.ok(liste.objets.length >= 1);
  const premier = liste.objets[0]!;
  t.joueur.recevoir({ t: "dechets", op: { genre: "prendre", ref, i: premier.i } });
  assert.equal(t.dernier("inventaire")!.inventaire[premier.objet], 1);
  assert.deepEqual(t.dernier("fouille")!.fouille!.objets, liste.objets.slice(1));
  // En s'éloignant, la liste se referme.
  t.joueur.position = { x: e.x + 10, z: e.z, o: 0 };
  t.attendre(6);
  assert.equal(t.dernier("fouille")!.fouille, null);
});

test("démonter le vélo du fossé : il faut les outils ; il revient 7 jours plus tard, ailleurs", () => {
  const sans = monter("station");
  const velo = POINTS_LIEUX.station!.find((p) => p.id === "velo")!;
  const ou = placePoint("station", velo, 0);
  sans.joueur.position = { x: ou.x, z: ou.z + 1, o: 0 };
  sans.joueur.recevoir({ t: "dechets", op: { genre: "demonter", ref: "p:velo" } });
  assert.match(sans.infos().at(-1)!, /[Ss]errer|[Vv]isser|outil/);

  const t = monter("station", { sac_a_dos: 1, cle_plate: 1, tournevis: 1 });
  t.joueur.position = { x: ou.x, z: ou.z + 1, o: 0 };
  t.joueur.recevoir({ t: "dechets", op: { genre: "demonter", ref: "p:velo" } });
  t.attendre(50);
  const inv = t.dernier("inventaire")!.inventaire;
  assert.equal(inv.cadre_velo, 1);
  assert.equal(inv.roue_velo, 2);
  assert.equal(t.dernier("dechets_point")!.point.dispo, false);
  t.horloge.instant += 7 * 24 * 3_600_000 + 1000;
  t.attendre(6);
  const revenu = t.dernier("dechets_point")!.point;
  assert.equal(revenu.dispo, true);
  assert.notDeepEqual({ x: revenu.x, z: revenu.z }, ou);
});

test("les ordures jetées disparaissent au bout de 24 h, sauf sur le terrain personnel ; un objet de valeur reste", () => {
  const t = monter("station", { sac_a_dos: 1, canette: 2, gourde: 1 });
  t.joueur.position = { x: 100, z: 40, o: 0 };
  t.joueur.recevoir({ t: "jeter", objet: "canette", quantite: 2 });
  t.joueur.position = { x: 60, z: 45, o: 0 };
  t.joueur.recevoir({ t: "jeter", objet: "gourde", quantite: 1 });
  assert.equal(t.halte.sacs.length, 2);
  t.horloge.instant += DUREE_ORDURE_JETEE_MS + 60_000;
  t.attendre(6);
  assert.equal(t.halte.sacs.length, 1, "la canette s'efface, la gourde reste");
  assert.equal(t.halte.sacs[0]!.contenu.inventaire.gourde, 1);

  const chez = monter("terrain", { sac_a_dos: 1, canette: 1 });
  chez.joueur.recevoir({ t: "jeter", objet: "canette", quantite: 1 });
  chez.horloge.instant += 3 * DUREE_ORDURE_JETEE_MS;
  chez.attendre(6);
  assert.equal(chez.base.chargerSacs("terrain", chez.compte.id).length, 1);
});

test("les balises solaires restées au sol s'allument la nuit et attirent faiblement les Éteints", () => {
  const base = new Base(":memory:");
  const bruits: { id: string; s: Stimulus }[] = [];
  const vivant = { ajouterBruit: (id: string, s: Stimulus) => bruits.push({ id, s }), retirerBruit: () => {}, sacs: [] } as unknown as LieuVivant;
  // On cherche un instant de nuit à partir du début du monde.
  const debut = base.debutMonde();
  let instant = debut;
  while (!estNuit(heureDeJeu(instant, debut))) instant += 60_000;
  const couche = new CoucheDechets({
    id: 1,
    base,
    maintenant: () => instant,
    lieu: () => "station",
    position: () => ({ x: 0, z: 0 }),
    inventaire: () => ({}),
    litresGourde: () => 0,
    ajouter: () => {},
    commencer: () => {},
    info: () => {},
    envoyer: () => {},
    sacTropLourd: () => {},
    vivant: () => vivant,
    noterFait: () => {},
  });
  const c = registreDechets(base).couche("station");
  c.balises = () => [{ id: "balise:1:1:0", x: 30, z: 20 }];
  couche.tick(instant);
  assert.equal(bruits.length, 1, "la balise s'allume la nuit");
  assert.equal(bruits[0]!.id, "balise:1:1:0");
  assert.deepEqual({ portee: bruits[0]!.s.portee, intensite: bruits[0]!.s.intensite }, BALISE_LUMIERE_NUIT);
  assert.equal(bruits[0]!.s.genre, "lumiere");
});

test("le contrôle des messages : les opérations de déchets bien formées passent, les autres non", () => {
  assert.ok(messageValide({ t: "dechets", op: { genre: "ramasser", cx: 2, cz: 1, i: 3 } }));
  assert.ok(messageValide({ t: "dechets", op: { genre: "fouiller", ref: "c:2:1:0" } }));
  assert.ok(messageValide({ t: "dechets", op: { genre: "prendre", ref: "p:gravats", i: 0 } }));
  assert.ok(!messageValide({ t: "dechets", op: { genre: "ramasser", cx: 2.5, cz: 1, i: 3 } }));
  assert.ok(!messageValide({ t: "dechets", op: { genre: "prendre", ref: "x".repeat(80), i: 0 } }));
  assert.ok(!messageValide({ t: "dechets", op: { genre: "voler" } }));
});
