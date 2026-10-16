// Les règles pures du duel (0.11 ; duel-entre-joueurs.md D-5, D-6, D-12, D-14, D-23 ; plan-duel.md §3 B et C).

import { test } from "node:test";
import assert from "node:assert/strict";
import { ARMES, POINGS, armeDeCle, type Arme } from "./combat.ts";
import {
  EXCLUS_DU_TIRAGE,
  JAUGE_DUEL,
  PHRASES_DUEL,
  RECUL_MAX_MS,
  TAUX_DUEL_MAX,
  TAUX_DUEL_MIN,
  avecPossessif,
  partDuCoup,
  reculDuCoup,
  seGagneEnDuel,
  tauxDuel,
  tirerObjet,
  unitesTirables,
} from "./duel.ts";
import { LIEU_DES_CLES } from "./economie.ts";
import { OBJETS, type TypeObjet } from "./objets.ts";

test("D-14 : les poings retirent 4 points par seconde, la plus forte arme 6 ; l'écart ne dépasse jamais × 1,5", () => {
  assert.equal(JAUGE_DUEL, 50);
  assert.equal(tauxDuel(POINGS), TAUX_DUEL_MIN);
  const taux = ARMES.map(tauxDuel);
  assert.equal(Math.max(...taux), TAUX_DUEL_MAX);
  assert.ok(Math.max(...taux) / Math.min(...taux, tauxDuel(POINGS)) <= 1.5 + 1e-9);
  // Un exemplaire étoilé plus fort que tout reste borné à 6.
  const lame = armeDeCle("glaive#5") ?? ARMES[0]!;
  assert.ok(tauxDuel({ ...lame, degatsTorse: 99 }) <= TAUX_DUEL_MAX);
});

test("D-14 : la part d'un coup suit sa durée ; le coup appuyé retire plus, à proportion de sa lenteur", () => {
  for (const a of [POINGS, ...ARMES]) {
    assert.ok(Math.abs(partDuCoup(a, false) - (tauxDuel(a) * a.coup) / 1000) < 1e-9, a.nom);
    assert.ok(Math.abs(partDuCoup(a, true) / partDuCoup(a, false) - a.coupAppuye / a.coup) < 1e-9, a.nom);
  }
  // Par seconde de coups ininterrompus, simples ou appuyés : le même taux (pas d'avantage à l'un ou l'autre).
  const masse = ARMES.find((a) => a.objet === "masse")!;
  assert.ok(Math.abs(partDuCoup(masse, true) / (masse.coupAppuye / 1000) - partDuCoup(masse, false) / (masse.coup / 1000)) < 1e-9);
});

/**
 * Un duel simulé entre deux joueurs de même force (la même arme) : chacun frappe dès que son geste le permet ; une
 * part des coups est esquivée ou manquée. Renvoie la durée (s) jusqu'à ce qu'une jauge soit vide.
 */
function dureeDuel(arme: Arme, touche: number, alea: () => number): number {
  const jauges = [JAUGE_DUEL, JAUGE_DUEL];
  const prochain = [0, arme.coup / 2];
  let t = 0;
  while (jauges[0]! > 0 && jauges[1]! > 0) {
    const qui = prochain[0]! <= prochain[1]! ? 0 : 1;
    t = prochain[qui]!;
    // Un coup appuyé sur quatre, comme un joueur qui varie.
    const appuye = alea() < 0.25;
    if (alea() < touche) jauges[1 - qui]! -= partDuCoup(arme, appuye);
    prochain[qui]! += appuye ? arme.coupAppuye : arme.coup;
  }
  return t / 1000;
}

test("D-5, D-27 : un duel simulé entre deux joueurs de même force dure de 10 à 20 s", () => {
  let graine = 7;
  const alea = () => ((graine = (graine * 16807) % 2147483647) / 2147483647);
  // Tous les coups touchés (le plus court) : 8 à 13 s, quelle que soit l'arme (D-14, D-27).
  for (const a of [POINGS, ...ARMES]) {
    const d = dureeDuel(a, 1, alea);
    assert.ok(d >= 7 && d <= 13, `${a.nom} : ${d.toFixed(1)} s`);
  }
  // Avec les esquives et les ratés (deux coups sur trois touchent), en moyenne sur cent duels : 10 à 20 s.
  for (const objet of [null, "machette", "masse", "couteau", "glaive"] as const) {
    const a = objet ? ARMES.find((x) => x.objet === objet)! : POINGS;
    let total = 0;
    for (let i = 0; i < 100; i++) total += dureeDuel(a, 2 / 3, alea);
    const moyenne = total / 100;
    assert.ok(moyenne >= 10 && moyenne <= 20, `${a.nom} : ${moyenne.toFixed(1)} s`);
  }
});

test("D-12 : le tirage n'offre jamais un objet-clé, une clef de porte, une pièce de famille, un sac ou ce qui roule", () => {
  const exclus: TypeObjet[] = [...(Object.keys(LIEU_DES_CLES) as TypeObjet[]), ...EXCLUS_DU_TIRAGE];
  for (const t of exclus) assert.ok(t in OBJETS, `${t} existe`);
  for (const t of exclus) assert.equal(seGagneEnDuel(t), false, t);
  const sac = Object.fromEntries(exclus.map((t) => [t, 1]));
  assert.equal(unitesTirables(sac), 0);
  assert.equal(tirerObjet(sac, 0.5), null);
  // L'arme en main peut être prise ; un exemplaire étoilé reste lui-même.
  assert.equal(seGagneEnDuel("machette"), true);
  assert.equal(tirerObjet({ ...sac, "lame_forgee#4": 1 }, 0.99), "lame_forgee#4");
});

test("§5 : une chance par unité", () => {
  const sac = { sac_a_dos: 1, buche: 3, conserve: 1 };
  assert.equal(unitesTirables(sac), 4);
  const tires = [0, 0.26, 0.51, 0.76].map((a) => tirerObjet(sac, a));
  assert.deepEqual(tires, ["buche", "buche", "buche", "conserve"]);
  assert.equal(tirerObjet({}, 0.3), null);
});

test("chantier C : le rembobinage, 150 ms plus la moitié du ping, 300 ms au plus", () => {
  assert.equal(reculDuCoup(0), 150);
  assert.equal(reculDuCoup(100), 200);
  assert.equal(reculDuCoup(2000), RECUL_MAX_MS);
  assert.equal(reculDuCoup(Number.NaN), 150);
});

test("D-9, D-23 : les phrases du serveur, mot pour mot", () => {
  assert.equal(PHRASES_DUEL.debut("Paul"), "Duel avec Paul !");
  assert.equal(PHRASES_DUEL.gagne("machette"), "Duel gagné : tu prends sa machette de fortune.");
  assert.equal(PHRASES_DUEL.gagneAuSol("machette"), "Duel gagné : sa machette de fortune est à tes pieds.");
  assert.equal(PHRASES_DUEL.gagneSacVide, "Duel gagné, mais son sac est vide.");
  assert.equal(PHRASES_DUEL.perdu("Paul", "machette"), "Duel perdu : Paul prend ta machette de fortune.");
  assert.equal(PHRASES_DUEL.perduSacVide, "Duel perdu. Ton sac était vide.");
  assert.equal(PHRASES_DUEL.fuite, "Trop loin : duel annulé.");
  assert.equal(PHRASES_DUEL.partir, "Pas pendant un duel.");
  assert.equal(PHRASES_DUEL.enDuel, "Ils sont en duel.");
  assert.equal(PHRASES_DUEL.protege, "Il vient de perdre : laisse-le.");
  assert.equal(PHRASES_DUEL.dieu, "On ne se bat pas avec Dieu.");
  // (La machette du jeu s'appelle « machette de fortune ».) « sa » ou « son » selon l'objet.
  assert.equal(avecPossessif("marteau", "sa"), "son marteau");
  assert.equal(avecPossessif("epieu", "ta"), "ton épieu");
  assert.equal(avecPossessif("hache", "sa"), "sa hache remmanchée");
  assert.equal(avecPossessif("cle_plate", "ta"), "ta clé plate");
});
