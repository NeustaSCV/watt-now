// Plan 0.10, chantier B : les matières de récupération (le tube d'aluminium, ses démontages, l'échelle et la chaise de
// camping), les objets-clés du niveau 2, le Comptoir qui les a toujours après une visite de leur lieu, plus aucun repli,
// et la règle du butin étendue au niveau 2.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { LIEU_DES_CLES, etalPour, prixVente, PRIX_CLES_L1 } from "../../commun/src/economie.ts";
import { ACCESSOIRES_FEU, LIGNEES_INSTALLATIONS, VOIE_CREUSEE, VOIE_SURFACE, etapeAccessoire, type Etape } from "../../commun/src/lignees.ts";
import { COMPTOIR, DUREE_VOYAGE_S, SORTIES_STATION, SORTIE_TERRAIN } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { OBJETS } from "../../commun/src/objets.ts";
import { QUALITES_OBJETS, niveauQualite } from "../../commun/src/recettes.ts";
import { tableDechets } from "../../commun/src/dechets.ts";
import {
  CHANCE_CLE_COURANTE,
  CHANCE_CLE_RARE,
  CLES_L1A,
  CLES_L1B,
  CLES_L2A,
  CLES_L2B,
  CLES_RARES,
  COURANTS_AU_NIVEAU_2,
  DEMONTAGE,
  EN_PLUS_PAR_LIEU,
  VESTIGES,
  etapeButin,
  tableDeFouille,
  tirerCleRare,
} from "../../commun/src/vestiges.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

function monter(inventaire: Record<string, number>, avant?: (base: Base, id: number) => void) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "mecanistes");
  base.sauverInventaire(compte.id, { sac_a_dos: 1, ...inventaire });
  base.sauverQuetes(compte.id, { faits: {}, finies: ["comptoir"], primes: 0 });
  avant?.(base, compte.id);
  let instant = 1_000_000;
  const recus: MessageServeur[] = [];
  const halte = new Halte(base, () => 0.5);
  halte.eteints = [];
  const comptoir = new Comptoir(base, instant);
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, halte, () => 0.99, comptoir);
  const attendre = (secondes: number, pas = 0.25) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      halte.tick(instant, pas);
      joueur.tick(pas);
    }
  };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  const inv = () => dernier("inventaire")?.inventaire ?? {};
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
  const faits = () => (joueur as unknown as { quetes: { etat: { faits: Record<string, number> } } }).quetes.etat.faits;
  const poche = (valeur: number) => ((joueur as unknown as { poche: { valeur: number; majLe: number } }).poche = { valeur, majLe: instant });
  return { base, compte, joueur, comptoir, attendre, dernier, infos, inv, allerAuGuichet, faits, poche };
}

// ---------- Plus aucun repli ----------

test("aucun repli n'est proposé nulle part : ni dans les lignées, ni dans les accessoires, et replis.ts n'existe plus", () => {
  const etapes: Etape[] = [
    ...VOIE_SURFACE,
    ...VOIE_CREUSEE,
    ...Object.values(LIGNEES_INSTALLATIONS).flatMap((l) => [...(l ?? [])]),
    ...Object.values(ACCESSOIRES_FEU).map((a) => etapeAccessoire(a)),
  ];
  assert.ok(etapes.length > 20);
  for (const e of etapes) {
    if (!e.cle) continue;
    assert.equal("replis" in e.cle, false, `${e.id} : un repli`);
    // Aucune phrase de repli (« Ou deux barres… ») dans ce que la fiche montre.
    for (const t of [e.apporte, e.examen, e.cle.idee, e.cle.ideePlusTard, ...e.cle.indice]) assert.doesNotMatch(t, /^Ou /, `${e.id} : ${t}`);
  }
  assert.equal(existsSync(new URL("../../commun/src/replis.ts", import.meta.url)), false);
});

test("sans son objet-clé, un niveau ne se monte pas, même avec ce que demandait son ancien repli (le seau, le bidon d'huile)", () => {
  const t = monter({ branche: 2, bidon_huile: 1, couteau: 1 }, (b, id) => b.ajouterInstallation(id, "recuperateur_pluie", 21, 20, 0));
  t.joueur.position = { x: 20, z: 20, o: 0 };
  const { base } = t;
  const id = t.compte.id;
  const i = base.chargerInstallations(id).find((x) => x.type === "recuperateur_pluie")!;
  t.joueur.recevoir({ t: "interagir", cible: { genre: "installation", id: i.id }, verbe: "ameliorer" });
  t.attendre(30);
  assert.equal(base.chargerInstallations(id).find((x) => x.id === i.id)!.niveau ?? 1, 1);
  assert.match(t.infos().join(" "), /seau galvanisé/);
  assert.doesNotMatch(t.infos().join(" "), /bidon d'huile de la station, rincé/);
});

// ---------- Les objets-clés du niveau 2 et le Comptoir ----------

test("les dix objets-clés du niveau 2 sont des objets du jeu, chacun à son lieu, hors des tables de fouille", () => {
  assert.deepEqual([...CLES_L2A], ["toles_ondulees", "couvertures_laine", "lanterne_tempete", "fer_souder", "roulements"]);
  assert.deepEqual([...CLES_L2B], ["porte_four", "jerrican_20l", "rabot", "cloche_bronze", "soufflet_forge"]);
  for (const t of CLES_L2A) assert.equal(LIEU_DES_CLES[t], "grand_hotel", t);
  for (const t of CLES_L2B) assert.equal(LIEU_DES_CLES[t], "phare", t);
  for (const t of [...CLES_L2A, ...CLES_L2B]) {
    const d = VESTIGES[t as keyof typeof VESTIGES];
    assert.ok(d && "horsTirage" in d && d.horsTirage, `${t} : hors tirage`);
    assert.ok(OBJETS[t].poids > 0 && OBJETS[t].description.length > 20, t);
    assert.doesNotMatch(`${OBJETS[t].nom} ${OBJETS[t].description}`, /\bclés?\b/i, t);
    assert.equal(prixVente(t), PRIX_CLES_L1.vente, t);
  }
  // Le rabot et le fer à souder sont des outils : Raboter 1 et Souder 1.
  assert.equal(niveauQualite({ rabot: 1 }, "raboter"), 1);
  assert.equal(niveauQualite({ fer_souder: 1 }, "souder"), 1);
  assert.deepEqual(QUALITES_OBJETS.rabot, { raboter: 1 });
  // Le jerrican percé (I5) reste un déchet ; le jerrican de 20 L est un autre objet.
  assert.equal(OBJETS.jerrican.nom, "jerrican percé");
  assert.equal(OBJETS.jerrican_20l.nom, "jerrican de 20 L");
});

test("un objet-clé du niveau 2 s'achète au Comptoir après la visite de son lieu, jamais avant, et ne manque jamais", () => {
  const t = monter({});
  t.allerAuGuichet();
  t.poche(5_000);
  // Avant la visite de l'hôtel : absent de l'étal, et refusé.
  assert.equal(etalPour(t.comptoir.stock, t.faits()).toles_ondulees, undefined);
  t.joueur.recevoir({ t: "comptoir", op: { genre: "acheter", objet: "toles_ondulees", quantite: 1 } });
  assert.match(t.infos().at(-1)!, /Va d'abord voir le Grand Hôtel/);
  assert.equal(t.inv().toles_ondulees, undefined);
  // L'hôtel visité : toujours à l'étal, autant de fois qu'on l'achète ; le stock n'en sait rien.
  t.faits()["visite:grand_hotel"] = 1;
  assert.equal(etalPour(t.comptoir.stock, t.faits()).toles_ondulees, 1);
  assert.equal(etalPour(t.comptoir.stock, t.faits()).rabot, undefined, "le rabot attend la visite du phare");
  for (let k = 1; k <= 3; k++) {
    t.joueur.recevoir({ t: "comptoir", op: { genre: "acheter", objet: "lanterne_tempete", quantite: 1 } });
    assert.equal(t.inv().lanterne_tempete, k);
  }
  t.joueur.recevoir({ t: "comptoir", op: { genre: "acheter", objet: "toles_ondulees", quantite: 1 } });
  assert.equal(t.inv().toles_ondulees, 1);
  assert.equal(t.comptoir.stock.lanterne_tempete, undefined);
  // Le client voit l'étal de ses visites : l'objet-clé y est, « toujours disponible ».
  assert.equal(t.dernier("comptoir")!.comptoir.stock.lanterne_tempete, 1);
  // Revendu, il ne remplit pas le stock (le Comptoir en a toujours).
  t.joueur.recevoir({ t: "comptoir", op: { genre: "vendre", objet: "lanterne_tempete", quantite: 1 } });
  assert.equal(t.inv().lanterne_tempete, 2);
  assert.equal(t.comptoir.stock.lanterne_tempete, undefined);
  // Le phare visité : ses cinq objets-clés aussi.
  t.faits()["visite:phare"] = 1;
  t.joueur.recevoir({ t: "comptoir", op: { genre: "acheter", objet: "rabot", quantite: 1 } });
  assert.equal(t.inv().rabot, 1);
});

test("les clés de L1 aussi sont toujours disponibles après la visite de leur lieu, sans stock ni réassort", () => {
  const t = monter({});
  t.allerAuGuichet();
  t.poche(5_000);
  t.faits()["visite:moulin"] = 1;
  for (let k = 1; k <= 2; k++) {
    t.joueur.recevoir({ t: "comptoir", op: { genre: "acheter", objet: "etau", quantite: 1 } });
    assert.equal(t.inv().etau, k);
  }
  // Une partie de la 0.9 gardait une clé de chaque en stock : elle ne compte plus, et s'efface au réassort.
  const stock09 = { buche: 10, seau_10l: 0, etau: 1 };
  assert.deepEqual(etalPour(stock09, { "visite:moulin": 1 }), { buche: 10, toile_jute: 1, feuillards: 1, etau: 1 });
});

// ---------- Le tube d'aluminium ----------

test("un parasol démonté donne un tube d'aluminium (et sa bâche), plus de barre de métal", () => {
  assert.deepEqual(DEMONTAGE.parasol!.donne, { tube_aluminium: 1, bache: 1 });
  const t = monter({ parasol: 1, cle_plate: 1 });
  t.joueur.recevoir({ t: "demonter", objet: "parasol" });
  t.attendre(15);
  assert.equal(t.inv().tube_aluminium, 1);
  assert.equal(t.inv().bache, 1);
  assert.equal(t.inv().barre_metal, undefined);
  assert.equal(t.inv().parasol, undefined);
});

test("l'échelle en aluminium donne 4 tubes ; la chaise de camping 2 tubes et un chiffon ; et les autres sources (N2-04)", () => {
  const t = monter({ echelle_aluminium: 1, pierre: 1 });
  t.joueur.recevoir({ t: "demonter", objet: "echelle_aluminium" });
  t.attendre(20);
  assert.equal(t.inv().tube_aluminium, 4);
  assert.deepEqual(DEMONTAGE.chaise_camping!.donne, { tube_aluminium: 2, chiffons: 1 });
  assert.deepEqual(DEMONTAGE.debroussailleuse!.donne, { tube_aluminium: 1, plastique: 2 });
  assert.deepEqual(DEMONTAGE.trottinette_enfant!.donne, { tube_aluminium: 1, aluminium: 3, caoutchouc: 1 });
  assert.deepEqual(DEMONTAGE.perche_selfie!.donne, { tube_aluminium: 1 });
  // Le tube et la chute sont deux objets ; jamais « aluminium » seul dans leurs noms.
  assert.equal(OBJETS.tube_aluminium.nom, "tube d'aluminium");
  assert.equal(OBJETS.aluminium.nom, "chute d'aluminium");
});

test("l'échelle est dans les ateliers (station, Moulin, Coopérative) et le hangar ; la chaise au jardin de la station et sur les berges du gué", () => {
  for (const lieu of ["atelier", "atelier_coop", "hangar"] as const) {
    assert.equal(EN_PLUS_PAR_LIEU[lieu]?.echelle_aluminium, "P", lieu);
    assert.ok(tableDeFouille(lieu).some(([t]) => t === "echelle_aluminium"), lieu);
  }
  assert.ok(!tableDeFouille("boutique").some(([t]) => t === "echelle_aluminium"));
  const dans = (lieu: "jardin" | "berge") => Object.values(tableDechets(lieu)).some((l) => l.some(([t]) => t === "chaise_camping"));
  assert.ok(dans("jardin"));
  assert.ok(dans("berge"));
});

// ---------- Le fil dentaire, la règle du butin ----------

test("le fil dentaire est rare au niveau 1, et prêt à être courant au niveau 2", () => {
  assert.equal(VESTIGES.fil_dentaire.rarete, "R");
  assert.equal(COURANTS_AU_NIVEAU_2.fil_dentaire, "C");
});

test("R-BUTIN au niveau 2 : les objets-clés du niveau 2 rares à H2 et dans l'autre L2 ; ceux du niveau 1 plus courants", () => {
  assert.equal(etapeButin("route_pont"), "H2A");
  assert.equal(etapeButin("corniche"), "H2B");
  assert.equal(etapeButin("grand_hotel"), "L2A");
  assert.equal(etapeButin("phare"), "L2B");
  assert.deepEqual(CLES_RARES.L2A.cles, CLES_L2B);
  assert.deepEqual(CLES_RARES.L2B.cles, CLES_L2A);
  assert.deepEqual([...CLES_RARES.H2A.cles].sort(), [...CLES_L2A, ...CLES_L2B].sort());
  for (const e of ["H2A", "H2B", "L2A", "L2B"] as const) {
    assert.equal(CLES_RARES[e].chance, CHANCE_CLE_RARE);
    assert.equal(CLES_RARES[e].courantes?.chance, CHANCE_CLE_COURANTE);
    assert.deepEqual([...CLES_RARES[e].courantes!.cles].sort(), [...CLES_L1A, ...CLES_L1B].sort());
  }
  assert.ok(CHANCE_CLE_COURANTE > CHANCE_CLE_RARE);
  // Au niveau 1, rien ne change : pas de tirage courant.
  for (const e of ["H1A", "H1B", "L1A", "L1B"] as const) assert.equal(CLES_RARES[e].courantes, undefined);
  // Sur 40 000 fouilles à l'hôtel : ≈ 2 % d'objets du phare, ≈ 6 % de clés de L1 (une au plus par fouille).
  let graine = 11;
  const alea = () => ((graine = (graine * 16807) % 2147483647) - 1) / 2147483646;
  let n2 = 0;
  let n1 = 0;
  for (let i = 0; i < 40_000; i++) {
    const t = tirerCleRare("L2A", alea);
    if (t && CLES_L2B.includes(t)) n2++;
    else if (t && [...CLES_L1A, ...CLES_L1B].includes(t)) n1++;
    else assert.equal(t, null);
  }
  assert.ok(Math.abs(n2 / 40_000 - CHANCE_CLE_RARE) < 0.004, `${n2}`);
  assert.ok(Math.abs(n1 / 40_000 - (1 - CHANCE_CLE_RARE) * CHANCE_CLE_COURANTE) < 0.006, `${n1}`);
});
