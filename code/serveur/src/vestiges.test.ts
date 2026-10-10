// Vestiges, lot 1 (0.3, P-003, Book 02 §5) : la fouille rapporte du bric-à-brac, on le démonte en composants,
// on le vend au Comptoir, et le sac trop plein oblige à choisir.

import { test } from "node:test";
import assert from "node:assert/strict";
import { prixAchat } from "../../commun/src/economie.ts";
import { COMPTOIR, DUREE_VOYAGE_S, SORTIES_STATION, SORTIE_TERRAIN } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { OBJETS, estObjet } from "../../commun/src/objets.ts";
import { energieGrise, multiplicateurQualites, objetsSansEnergieGrise } from "../../commun/src/recettes.ts";
import { USAGES } from "../../commun/src/terrain.ts";
import { COMPOSANTS, DEMONTAGE, LIEU_DE_FOUILLE, VESTIGES, estOrdure, tableDeFouille, tirerVestiges, type LieuFouille } from "../../commun/src/vestiges.ts";
import { estVestigeLot2 } from "../../commun/src/vestiges-lot2.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { messageValide } from "./controle.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

/** Un aléa constant élevé : aucun Éteint ne vient, et le tirage prend 3 fois le dernier vestige de la table. */
const ALEA_HAUT = () => 0.99;

function monter(inventaire: Record<string, number>, alea = ALEA_HAUT) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "mecanistes");
  base.sauverInventaire(compte.id, inventaire);
  base.sauverQuetes(compte.id, { faits: {}, finies: ["comptoir"], primes: 0 });
  let instant = 1_000_000;
  const recus: MessageServeur[] = [];
  const halte = new Halte(base, () => 0.5);
  halte.eteints = [];
  const comptoir = new Comptoir(base, instant);
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, halte, alea, comptoir);
  const attendre = (secondes: number, pas = 0.25) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      halte.tick(instant, pas);
      joueur.tick(pas);
    }
  };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  const vestige = (type: string) => joueur.bienvenue(0).ressources.find((r) => r.type === type)!;
  const allerA = (x: number, z: number) => (joueur.position = { x, z: z + 0.6, o: 0 });
  const allerAuGuichet = () => {
    joueur.position = { x: SORTIE_TERRAIN.boite.x, z: SORTIE_TERRAIN.boite.z, o: 0 };
    joueur.recevoir({ t: "voyager", vers: "comptoir" });
    attendre(DUREE_VOYAGE_S + 0.5, 0.5);
    const est = SORTIES_STATION[1]!;
    joueur.position = { x: est.boite.x, z: est.boite.z, o: 0 };
    joueur.recevoir({ t: "voyager", vers: "comptoir" });
    attendre(DUREE_VOYAGE_S + 0.5, 0.5);
    joueur.position = { x: COMPTOIR.guichet.x, z: COMPTOIR.guichet.z + 0.8, o: Math.PI };
  };
  return { base, joueur, comptoir, attendre, dernier, infos, vestige, allerA, allerAuGuichet };
}

/** Un aléa reproductible (générateur congruentiel), pour tirer beaucoup de fouilles. */
function aleaGraine(graine: number): () => number {
  let x = graine;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
}

test("le catalogue : une cinquantaine de vestiges et une dizaine de composants, chacun pesé et valorisé", () => {
  const vestiges = Object.keys(VESTIGES);
  const composants = Object.keys(COMPOSANTS);
  // Ceux qu'on trouve en fouillant ; les objets propres à la Coopérative (hors tirage) viennent en plus. Les déchets
  // du lot 2 (0.7) ont leur propre test (commun/src/dechets.test.ts).
  const tirables = Object.entries(VESTIGES).filter(([t, d]) => !("horsTirage" in d && d.horsTirage) && !estVestigeLot2(t));
  // Le métier des familles (Book 25 §9.2, 0.6) en ajoute treize, qui servent enfin à quelque chose.
  assert.ok(tirables.length >= 45 && tirables.length <= 75, `${tirables.length} vestiges tirables`);
  assert.ok(composants.length >= 10, `${composants.length} composants`);
  for (const t of [...vestiges, ...composants]) {
    assert.ok(estObjet(t), t);
    assert.ok(OBJETS[t].poids > 0, `${t} a un poids`);
    // Les ordures du lot 2 valent 0, exprès (Q2).
    assert.ok(energieGrise(t) > 0 || estOrdure(t), `${t} a une valeur`);
  }
  assert.deepEqual(objetsSansEnergieGrise(), []);
  // Ce que donne un démontage existe, et ce sont de vrais objets.
  for (const [t, d] of Object.entries(DEMONTAGE)) {
    assert.ok(estObjet(t), t);
    for (const c of Object.keys(d!.donne)) assert.ok(estObjet(c), `${t} → ${c}`);
  }
  // Les lieux de fouille sont de vraies ressources à fouiller (ou à démonter, pour l'épave de voiture).
  for (const r of Object.keys(LIEU_DE_FOUILLE)) assert.ok(USAGES[r as keyof typeof USAGES], r);
});

test("chaque lieu tire ses vestiges dans sa propre table : 1 à 3, jamais d'ailleurs", () => {
  for (const lieu of ["boutique", "atelier", "epave", "grange"] as LieuFouille[]) {
    const permis = new Set(tableDeFouille(lieu).map(([t]) => t));
    const alea = aleaGraine(42);
    const vus = new Set<string>();
    for (let i = 0; i < 300; i++) {
      const trouve = tirerVestiges(lieu, alea);
      const n = Object.values(trouve).reduce((s, k) => s + (k ?? 0), 0);
      assert.ok(n >= 1 && n <= 3, `${lieu} : ${n} vestiges`);
      for (const t of Object.keys(trouve)) {
        assert.ok(permis.has(t as keyof typeof VESTIGES), `${t} ne vient pas de ${lieu}`);
        vus.add(t);
      }
    }
    assert.ok(vus.size >= 8, `${lieu} : de la variété (${vus.size} sortes)`);
  }
  // Les épaves donnent de la voiture, la grange de la ferme, la boutique pas d'outils de garage.
  assert.ok(tableDeFouille("epave").some(([t]) => t === "chambre_air"));
  assert.ok(tableDeFouille("grange").some(([t]) => t === "nain_jardin"));
  assert.ok(!tableDeFouille("boutique").some(([t]) => t === "sac_ciment"));
  // Les communs sortent plus souvent que les rares.
  const atelier = new Map(tableDeFouille("atelier"));
  assert.ok(atelier.get("bocal_clous")! > atelier.get("groupe_electrogene")!);
});

test("fouiller la caisse à outils donne les outils habituels plus du bric-à-brac de l'atelier", () => {
  const t = monter({ couteau: 1, sac_a_dos: 1 });
  const caisse = t.vestige("caisse_outils");
  t.allerA(caisse.x, caisse.z);
  t.joueur.recevoir({ t: "interagir", cible: { genre: "ressource", id: caisse.id }, verbe: "fouiller" });
  t.attendre(5);
  const inv = t.dernier("inventaire")!.inventaire;
  assert.equal(inv.cle_plate, 1);
  assert.equal(inv.tete_hache, 1);
  // Aléa 0,99 : trois fois le dernier vestige de la table de l'atelier.
  const dernierAtelier = tableDeFouille("atelier").at(-1)![0];
  assert.equal(inv[dernierAtelier], 3);
  assert.match(t.infos().join(" "), /Dans le fatras, tu trouves aussi/);
});

test("le bric-à-brac qui ne rentre pas reste par terre, en petit tas ramassable", () => {
  // Sans sac (10 kg de poches) et déjà 6,2 kg : les outils de la caisse (2 kg avec la tête de marteau, plan 0.8)
  // passent, le bric-à-brac non.
  const t = monter({ couteau: 1, pierre: 3 });
  const caisse = t.vestige("caisse_outils");
  t.allerA(caisse.x, caisse.z);
  t.joueur.recevoir({ t: "interagir", cible: { genre: "ressource", id: caisse.id }, verbe: "fouiller" });
  t.attendre(5);
  const dernierAtelier = tableDeFouille("atelier").at(-1)![0];
  const inv = t.dernier("inventaire")!.inventaire;
  assert.equal(inv.cle_plate, 1);
  assert.equal(inv[dernierAtelier], undefined);
  const tas = t.dernier("sacs")!.sacs.find((s) => s.jete);
  assert.ok(tas, "un tas au sol");
  assert.equal(tas!.contenu?.[dernierAtelier], 3);
  assert.match(t.infos().join(" "), /laissé par terre/);
});

test("démonter un vestige demande l'outil, prend du temps et donne ses composants", () => {
  const sansOutil = monter({ smartphone_fele: 1 });
  sansOutil.joueur.recevoir({ t: "demonter", objet: "smartphone_fele" });
  assert.match(sansOutil.infos().at(-1)!, /visser \(niveau 1\)/);
  sansOutil.attendre(8);
  assert.equal(sansOutil.dernier("inventaire"), undefined, "rien n'a changé");

  const t = monter({ smartphone_fele: 1, couteau: 1 });
  t.joueur.recevoir({ t: "demonter", objet: "smartphone_fele" });
  assert.equal(t.dernier("action")!.etat, "debut");
  t.attendre(1);
  assert.equal(t.dernier("inventaire"), undefined, "pas encore fini");
  t.attendre(6);
  const inv = t.dernier("inventaire")!.inventaire;
  assert.equal(inv.smartphone_fele, undefined);
  for (const [c, k] of Object.entries(DEMONTAGE.smartphone_fele!.donne)) assert.equal(inv[c as keyof typeof inv], k, c);
  assert.equal(inv.couteau, 1, "l'outil reste");

  // Le groupe électrogène demande une clé (Serrer 2) : un couteau ne suffit pas.
  assert.equal(multiplicateurQualites({ couteau: 1 }, DEMONTAGE.groupe_electrogene!.qualites), null);
  const g = monter({ groupe_electrogene: 1, couteau: 1, sac_a_dos: 1 });
  g.joueur.recevoir({ t: "demonter", objet: "groupe_electrogene" });
  assert.match(g.infos().at(-1)!, /serrer \(niveau 2\)/);

  // Un vestige qui ne se démonte pas le dit.
  const n = monter({ nain_jardin: 1 });
  n.joueur.recevoir({ t: "demonter", objet: "nain_jardin" });
  assert.match(n.infos().at(-1)!, /rien à en tirer/);
});

test("un vestige se vend au Comptoir à sa valeur (moins la fourchette)", () => {
  const t = monter({ ordinateur_portable: 2, nain_jardin: 1 });
  t.allerAuGuichet();
  t.joueur.recevoir({ t: "comptoir", op: { genre: "vendre", objet: "ordinateur_portable", quantite: 2 } });
  const prix = prixAchat("ordinateur_portable", false)!;
  assert.ok(prix > 0 && prix < VESTIGES.ordinateur_portable.valeur);
  assert.equal(t.dernier("wotts")!.wotts.poche, prix * 2);
  assert.equal(t.comptoir.stock.ordinateur_portable, 2);
  // L'absurde vaut peu.
  assert.ok(prixAchat("nain_jardin", false)! <= 1);
});

test("le contrôle des messages accepte « demonter » d'un vrai objet et refuse le reste", () => {
  assert.ok(messageValide({ t: "demonter", objet: "smartphone_fele" }));
  for (const m of [
    { t: "demonter" },
    { t: "demonter", objet: "toString" },
    { t: "demonter", objet: "__proto__" },
    { t: "demonter", objet: 3 },
    { t: "demonter", objet: ["smartphone_fele"] },
    { t: "demonter", objet: "objet_qui_n_existe_pas" },
  ]) {
    assert.equal(messageValide(m), false, JSON.stringify(m));
  }
});
