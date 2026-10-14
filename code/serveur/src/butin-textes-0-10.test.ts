// Plan 0.10, chantier L : le butin, les indices, les textes du niveau 2, et les décisions de la vague 2 qu'il applique.
// - R-BUTIN aux quatre lieux de la côte : chaque fouille passe par le tirage des objets-clés (les clés de L1 plus
//   courantes, 4 % ; celles de l'autre L2 rares) ; aucun objet-clé ne traîne hors de sa place ; la boîte de roulements
//   de l'hôtel est une boîte (V1-01).
// - Chaque objet-clé du niveau 2 a son idée et son indice (le genre de lieu, puis le lieu), sans divulgâcher.
// - V2-01 : le péage ne redemande rien dans le sens lieu → terrain, même l'heure passée.
// - V2-02 : au péage, une ordure compte si le Comptoir la reprend ; à 0, non.

import { test } from "node:test";
import assert from "node:assert/strict";
import { contenuDe } from "../../commun/src/contenu-lieux.ts";
import { prixAchat } from "../../commun/src/economie.ts";
import { DUREE_VOYAGE_S, SORTIE_TERRAIN, arriveeDans, etapeVers, sortiesDe, type LieuId } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { OBJETS, type TypeObjet } from "../../commun/src/objets.ts";
import { DUREE_PASSAGE_MS, PRIX_PASSAGE, TEXTES_PEAGE, valeurObjets, valeurPeage, verifierPaiement } from "../../commun/src/peage.ts";
import { etapesAvecCle } from "../../commun/src/progression.ts";
import { USAGES } from "../../commun/src/terrain.ts";
import {
  CHANCE_CLE_COURANTE,
  CHANCE_CLE_RARE,
  CLES_L1A,
  CLES_L1B,
  CLES_L2A,
  CLES_L2B,
  CLES_RARES,
  DEMONTAGE,
  LIEU_DE_FOUILLE,
  estOrdure,
  etapeButin,
  tableDeFouille,
  tirerVestiges,
  type LieuFouille,
} from "../../commun/src/vestiges.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Cooperatives } from "./cooperative.ts";
import { Gue } from "./gue.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { rendreSilencieux } from "./journal.ts";
import { LieuxVivants } from "./lieux-vivants.ts";
import { Moulins } from "./moulin.ts";
import { Peage, vientDuLieu, type ContextePeage } from "./peage.ts";

rendreSilencieux(true);

const COTE = ["route_pont", "corniche", "grand_hotel", "phare"] as const;
const CLES_L1: readonly TypeObjet[] = [...CLES_L1A, ...CLES_L1B];
const TOUTES_LES_CLES: ReadonlySet<TypeObjet> = new Set([...CLES_L1, ...CLES_L2A, ...CLES_L2B]);

// ---------- R-BUTIN aux quatre lieux ----------

test("R-BUTIN : chaque fouille des quatre lieux de la côte a sa table, et son lieu tire les objets-clés hors de leur place", () => {
  for (const lieu of COTE) {
    const etape = etapeButin(lieu);
    assert.ok(etape, `${lieu} : une étape de butin`);
    // Au niveau 2 : les clés de L1 plus courantes (4 %, V1-07), toutes les six.
    assert.equal(CLES_RARES[etape].courantes?.chance, CHANCE_CLE_COURANTE, lieu);
    assert.deepEqual([...CLES_RARES[etape].courantes!.cles].sort(), [...CLES_L1].sort(), lieu);
    assert.equal(CLES_RARES[etape].chance, CHANCE_CLE_RARE, lieu);
    const fouilles = contenuDe(lieu)
      .ressources()
      .filter((r) => USAGES[r.type].verbe === "fouiller");
    assert.ok(fouilles.length >= 5, `${lieu} : ${fouilles.length} fouilles`);
    for (const r of fouilles) assert.ok(LIEU_DE_FOUILLE[r.type], `${lieu} : ${r.type} n'a pas de table de fouille (il ne tirerait aucun objet-clé)`);
  }
  // Dans un L2, les objets-clés de l'autre L2, rares ; jamais les siens (ils sont à leur place).
  assert.deepEqual([...CLES_RARES.L2A.cles].sort(), [...CLES_L2B].sort());
  assert.deepEqual([...CLES_RARES.L2B.cles].sort(), [...CLES_L2A].sort());
  // Aux haltes, les dix, rares.
  for (const e of ["H2A", "H2B"] as const) assert.deepEqual([...CLES_RARES[e].cles].sort(), [...CLES_L2A, ...CLES_L2B].sort());
});

test("R-BUTIN : en fouillant la côte, on trouve ≈ 4 % de clés de L1 ; à l'hôtel, jamais les siennes par chance", () => {
  let graine = 7;
  const alea = () => ((graine = (graine * 16807) % 2147483647) - 1) / 2147483646;
  for (const lieu of COTE) {
    const etape = etapeButin(lieu)!;
    const table = LIEU_DE_FOUILLE[contenuDe(lieu).ressources().find((r) => LIEU_DE_FOUILLE[r.type])!.type] as LieuFouille;
    let l1 = 0;
    const autres = new Set<TypeObjet>();
    const N = 20_000;
    for (let i = 0; i < N; i++) {
      const t = tirerVestiges(table, alea, etape);
      for (const k of Object.keys(t) as TypeObjet[]) {
        if (CLES_L1.includes(k)) l1++;
        else if (TOUTES_LES_CLES.has(k)) autres.add(k);
      }
    }
    // 4 % après les 2 % du tirage rare (une fouille donne au plus un objet-clé) : ≈ 3,9 %.
    assert.ok(l1 / N > 0.03 && l1 / N < 0.05, `${lieu} : ${((l1 / N) * 100).toFixed(1)} % de clés de L1`);
    for (const k of autres) assert.ok(CLES_RARES[etape].cles.includes(k), `${lieu} : ${k} ne devrait pas sortir ici`);
  }
});

test("R-BUTIN (R15) : aucun objet-clé dans les tables de fouille, ni dans ce que donnent les points de la côte hors de sa place", () => {
  for (const table of new Set(Object.values(LIEU_DE_FOUILLE))) {
    for (const [t] of tableDeFouille(table!)) assert.ok(!TOUTES_LES_CLES.has(t), `la table « ${table} » donne ${t}`);
  }
  const place: Record<string, readonly TypeObjet[]> = { grand_hotel: CLES_L2A, phare: CLES_L2B, route_pont: [], corniche: [] };
  for (const lieu of COTE) {
    for (const r of contenuDe(lieu).ressources()) {
      for (const t of Object.keys(USAGES[r.type].donne) as TypeObjet[]) {
        if (TOUTES_LES_CLES.has(t)) assert.ok(place[lieu]!.includes(t), `${lieu} : ${r.type} donne ${t}, hors de sa place`);
      }
    }
  }
});

test("la boîte de roulements de l'hôtel : une boîte, de trois roulements (V1-01), comme au Comptoir et par chance", () => {
  assert.deepEqual(USAGES.hotel_roulements.donne, { roulements: 1 });
  assert.deepEqual(DEMONTAGE.roulements!.donne, { roulement: 3 });
});

// ---------- Les indices des dix objets-clés du niveau 2 ----------

test("chaque objet-clé du niveau 2 a son idée (« tu y penses », « un jour ») et son indice en deux temps, sans divulgâcher", () => {
  const n2 = etapesAvecCle().filter((x) => x.etape.cle.ou === "L2A" || x.etape.cle.ou === "L2B");
  assert.equal(n2.length, 10, "les dix meubles du niveau 2");
  // Les dix objets-clés : cinq à l'hôtel, cinq au phare (le rabot et le fer à souder sont des outils : leur qualité).
  const couverts = new Set(n2.map((x) => x.etape.cle.objet ?? (x.etape.cle.qualite!.qualite === "raboter" ? "rabot" : "fer_souder")));
  assert.deepEqual([...couverts].sort(), [...CLES_L2A, ...CLES_L2B].sort());
  for (const { etape } of n2) {
    const c = etape.cle;
    assert.ok(c.idee.length > 10 && c.ideePlusTard.length > 10, etape.id);
    const [genre, lieu] = c.indice;
    assert.equal(lieu, c.ou === "L2A" ? "Au Grand Hôtel des Flots." : "Au phare du cap.", etape.id);
    // Le premier temps : un genre de lieu, pas le lieu ; rien du scénario (le cargo, l'épave, ce qui arrive par la mer).
    assert.doesNotMatch(genre, /Grand Hôtel des Flots|phare du cap|cargo|épave|conteneur|par la mer|viendra|livr/i, `${etape.id} : « ${genre} »`);
    assert.doesNotMatch(`${c.idee} ${c.ideePlusTard} ${genre}`, /cargo|épave|conteneur/i, etape.id);
  }
});

// ---------- Le péage : V2-02 (les ordures) ----------

test("V2-02 : au péage, une ordure compte si le Comptoir la reprend déjà (le sac de canettes) ; à 0, non (la canette)", () => {
  // Le sac de canettes est un déchet que le Comptoir reprend : il compte, à son prix de rachat.
  const sac = valeurPeage("sac_canettes");
  assert.ok(sac > 0, "le sac de canettes compte");
  assert.equal(sac, prixAchat("sac_canettes", false));
  // Les ordures à 0 (le Comptoir les refuse) ne comptent pas.
  for (const t of ["canette", "bouteille_plastique", "bouteille_verre", "carton"] as const) {
    assert.ok(estOrdure(t), t);
    assert.equal(valeurPeage(t), 0, t);
  }
  // Toute ordure : au péage, ce qu'en donne le Comptoir, ni plus ni moins.
  for (const t of Object.keys(OBJETS) as TypeObjet[]) if (estOrdure(t)) assert.equal(valeurPeage(t), prixAchat(t, false) ?? 0, t);
  // Assez de sacs de canettes paient le passage ; des canettes seules, jamais.
  const n = Math.ceil(PRIX_PASSAGE / sac);
  assert.equal(verifierPaiement({ sac_canettes: n }, { sac_canettes: n }, 0, 1000).accepte, true);
  assert.equal(valeurObjets({ canette: 50 }), 0);
  // Le texte de la caisse le dit.
  for (const p of ["pont", "tunnel"] as const) {
    assert.match(TEXTES_PEAGE[p].examen, /ce qu'il ne reprend pas ne compte pas/);
    assert.doesNotMatch(TEXTES_PEAGE[p].examen, /les ordures ne comptent pas/);
  }
});

// ---------- Le péage : V2-01 (à l'aller seulement) ----------

test("V2-01 : on arrive du côté du lieu en revenant de l'hôtel ou du phare ; du côté du terrain en partant", () => {
  assert.equal(vientDuLieu("route_pont", arriveeDans("route_pont", "grand_hotel").x, arriveeDans("route_pont", "grand_hotel").z), true);
  assert.equal(vientDuLieu("route_pont", arriveeDans("route_pont", "terrain").x, arriveeDans("route_pont", "terrain").z), false);
  assert.equal(vientDuLieu("corniche", arriveeDans("corniche", "phare").x, arriveeDans("corniche", "phare").z), true);
  assert.equal(vientDuLieu("corniche", arriveeDans("corniche", "terrain").x, arriveeDans("corniche", "terrain").z), false);
});

test("V2-01 : sur le retour, la porte est ouverte sans rien payer, même l'heure passée ; rien n'est pris ; jusqu'à la sortie de la halte", () => {
  const horloge = { t: 5_000_000 };
  const peage = new Peage(new Base(":memory:"), "pont");
  const infos: string[] = [];
  const envois: MessageServeur[] = [];
  const sac: Record<string, number> = { branche: 10 };
  const ctx: ContextePeage = { id: 1, maintenant: () => horloge.t, inventaire: () => sac, donner: () => assert.fail("rien ne quitte le sac"), info: (t) => infos.push(t), envoyer: (m) => envois.push(m) };
  peage.retour(1);
  peage.entrer(ctx);
  assert.deepEqual(envois.at(-1), { t: "passage", passage: "pont", ouvert: true, du: 0 });
  assert.equal(peage.payer(ctx, { branche: 4 }), false, "on ne paie pas au retour");
  assert.equal(infos.at(-1), TEXTES_PEAGE.pont.dejaPaye);
  horloge.t += 3 * DUREE_PASSAGE_MS;
  peage.suivre(ctx);
  assert.equal(peage.ouvertPour(1, horloge.t), true, "l'heure ne compte pas sur le retour");
  assert.ok(!infos.includes(TEXTES_PEAGE.pont.referme));
  // Sorti de la halte, le retour est fini : à l'aller suivant, on repaie.
  peage.sortir(1);
  assert.equal(peage.ouvertPour(1, horloge.t), false);
});

/** Un monde en mémoire, comme celui du serveur (le registre construit les lieux au premier passage). */
function monde() {
  const base = new Base(":memory:");
  let instant = base.debutMonde() + 1_000_000;
  const maintenant = () => instant;
  const alea = Math.random;
  const halte = new Halte(base);
  const gue = new Gue(base);
  const cooperatives = new Cooperatives(base, alea, maintenant);
  const moulins = new Moulins(base, alea, maintenant);
  const lieux = new LieuxVivants(base, { station: halte, cooperative: cooperatives, gue, moulin: moulins }, alea, maintenant);
  const joueurs: Joueur[] = [];
  const attendre = (secondes: number, pas = 0.5) => {
    for (let s = 0; s < secondes - 1e-9; s += pas) {
      instant += pas * 1000;
      for (const j of joueurs) j.tick(pas);
      lieux.tick(instant, pas);
    }
  };
  const nouveau = (pseudo: string) => {
    const compte = base.creerCompte(pseudo, "potager42", "mecanistes");
    base.sauverInventaire(compte.id, { sac_a_dos: 1, branche: 10 });
    const recus: MessageServeur[] = [];
    const joueur = new Joueur({ id: compte.id, pseudo, famille: "mecanistes" }, base, (m) => recus.push(m), maintenant, halte, alea, new Comptoir(base, instant), cooperatives, gue, moulins, lieux);
    joueurs.push(joueur);
    const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
    const voyager = (vers: LieuId) => {
      const etape = etapeVers(joueur.lieu, vers);
      const s = joueur.lieu === "terrain" ? SORTIE_TERRAIN : sortiesDe(joueur.lieu).find((x) => x.vers === etape || x.aussi?.includes(etape))!;
      joueur.position = { x: s.boite.x, z: s.boite.z, o: 0 };
      joueur.recevoir({ t: "voyager", vers });
      attendre(DUREE_VOYAGE_S + 0.5);
    };
    return { compte, joueur, dernier, voyager };
  };
  return { lieux, nouveau, attendre, sauter: (ms: number) => (instant += ms) };
}

test("V2-01, en jeu : au retour de l'hôtel par le pont et du phare par la corniche, la porte du péage est ouverte, même des heures après", () => {
  for (const [halte, lieu, passage] of [["route_pont", "grand_hotel", "pont"], ["corniche", "phare", "tunnel"]] as const) {
    const m = monde();
    const rose = m.nouveau("Rose");
    rose.voyager(lieu);
    assert.equal(rose.joueur.lieu, halte);
    assert.deepEqual(rose.dernier("passage"), { t: "passage", passage, ouvert: false, du: PRIX_PASSAGE }, `${halte} : à l'aller, on paie`);
    rose.voyager(lieu);
    assert.equal(rose.joueur.lieu, lieu);
    // Longtemps après (l'heure d'un passage payé serait passée), on rentre.
    m.sauter(3 * DUREE_PASSAGE_MS);
    rose.voyager("terrain");
    assert.equal(rose.joueur.lieu, halte);
    assert.deepEqual(rose.dernier("passage"), { t: "passage", passage, ouvert: true, du: 0 }, `${halte} : au retour, rien à payer`);
    const vivant = m.lieux.vivant(halte, 0)!;
    assert.notEqual(vivant.zonePour(rose.compte.id), vivant.zone, `${halte} : la porte ouverte pour elle`);
    m.attendre(2);
    assert.equal(rose.dernier("passage")!.ouvert, true, `${halte} : elle reste ouverte`);
    assert.equal(rose.joueur.bienvenue(0).inventaire.branche, 10, "rien n'est pris");
    rose.voyager("terrain");
    assert.equal(rose.joueur.lieu, "terrain");
  }
});
