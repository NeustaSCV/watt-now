// Le butin d'un lieu vivant (plan 0.8, chantier 10) : la repousse par lieu (B4), le butin personnel dans un lieu
// partagé (R4), le vrac qui grandit avec les voyageurs (B8). Un lieu fabriqué pour le test, sans Éteints.

import { test } from "node:test";
import assert from "node:assert/strict";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { ZONE_STATION } from "../../commun/src/lieux.ts";
import { REPOUSSE_MS, facteurVrac, vracEnJeu, type RessourceSol, type TypeRessource } from "../../commun/src/terrain.ts";
import { Base } from "./base.ts";
import { LieuVivant, type DefinitionLieuVivant, type Voyageur } from "./lieu-vivant.ts";

const MIN = 60_000;
const HEURE = 3_600_000;

/** Un lieu d'essai : 3 × 4 bûches en vrac, 2 pierres, un tas de bois personnel (10 prises), une enclume personnelle. */
function lieu(base = new Base(":memory:")) {
  const points: [TypeRessource, number][] = [
    ...Array.from({ length: 12 }, (): [TypeRessource, number] => ["buche", 10]),
    ["pierre", 20],
    ["pierre", 21],
    ["tas_bois", 30],
    ["piece_enclume", 40],
  ];
  const definition: DefinitionLieuVivant = {
    cle: "essai",
    sacs: { lieu: "essai", terrainDe: 0 },
    zone: ZONE_STATION,
    eteints: () => [],
    ressources: () => points.map(([type, x], i) => ({ id: i + 1, type, x: x + i * 0.1, z: 20 })),
    version: 1,
    butin: { repousse: { buche: 30 * MIN, pierre: 30 * MIN }, vrac: { buche: 4 }, personnel: { tas_bois: 10, piece_enclume: 1 } },
  };
  return { base, definition, lieu: new LieuVivant(base, definition, () => 0.5) };
}

function voyageur(id: number) {
  const recus: MessageServeur[] = [];
  const v: Voyageur & { recus: MessageServeur[] } = {
    recus,
    envoyer: (m) => recus.push(m),
    stimuli: () => [],
    humain: () => ({ id, x: 20, z: 20, discret: true, eclaire: false, intouchable: false }),
  };
  return v;
}

const de = (l: LieuVivant, type: TypeRessource) => [...l.ressources.values()].filter((r) => r.type === type);

test("la repousse par lieu : 30 min dans ce lieu, jamais au terrain (REPOUSSE_MS)", () => {
  const { lieu: l } = lieu();
  assert.equal(REPOUSSE_MS.buche, null, "au terrain, une bûche ne revient pas (B1)");
  assert.equal(REPOUSSE_MS.pierre, null);
  assert.equal(l.delaiRepousse("buche"), 30 * MIN);
  assert.equal(l.delaiRepousse("pierre"), 30 * MIN);
  // Ce que le lieu ne dit pas suit REPOUSSE_MS.
  assert.equal(l.delaiRepousse("tas_bois"), REPOUSSE_MS.tas_bois);
  const a = voyageur(1);
  l.entrer(a);
  const t0 = 1_000_000;
  const pierre = de(l, "pierre")[0]!;
  l.prendrePar(pierre, 1, t0);
  assert.equal(l.disponiblePour(pierre, 1, t0 + 29 * MIN), false);
  assert.equal(l.disponiblePour(pierre, 2, t0 + 29 * MIN), false, "partagée : prise pour tous");
  assert.equal(l.disponiblePour(pierre, 1, t0 + 30 * MIN), true);
  // Le tic la rend, et le dit.
  l.tick(t0 + 31 * MIN, 0.1);
  assert.ok(a.recus.some((m) => m.t === "ressource" && m.id === pierre.id && m.disponible));
});

test("une halte vide ne calcule pas sa repousse : rien ne s'écrit, et tout est là dès l'entrée", () => {
  const { lieu: l } = lieu();
  const t0 = 1_000_000;
  const pierre = de(l, "pierre")[0]!;
  const a = voyageur(1);
  l.entrer(a);
  l.prendrePar(pierre, 1, t0);
  l.sortir(a);
  l.tick(t0 + HEURE, 0.1);
  assert.notEqual(pierre.disponibleLe, 0, "personne : la repousse attend");
  // On revient : elle est disponible tout de suite (l'instant fait foi), et le tic suivant l'enregistre.
  const b = voyageur(2);
  l.entrer(b);
  assert.equal(l.disponiblePour(pierre, 2, t0 + HEURE), true);
  assert.equal(l.vuePour(2, "voltaiques", t0 + HEURE).find((r) => r.id === pierre.id)?.disponible, true);
  l.tick(t0 + HEURE + 10_000, 0.1);
  assert.equal(pierre.disponibleLe, 0);
});

test("le butin personnel : deux joueurs prennent chacun 10 bûches à leur tas, et le tas de l'un ne bouge pas quand l'autre se sert", () => {
  const { lieu: l } = lieu();
  const t0 = 1_000_000;
  const a = voyageur(1);
  const b = voyageur(2);
  l.entrer(a);
  l.entrer(b);
  const tas = de(l, "tas_bois")[0]!;
  const reste = (id: number, t: number) => l.vuePour(id, "voltaiques", t).find((r) => r.id === tas.id)!.reste;
  assert.equal(reste(1, t0), 10);
  for (let k = 0; k < 4; k++) l.prendrePar(tas, 1, t0 + k * 1000);
  assert.equal(reste(1, t0 + 5000), 6);
  assert.equal(reste(2, t0 + 5000), 10, "le tas de l'autre n'a pas bougé");
  assert.equal(b.recus.filter((m) => m.t === "ressource").length, 0, "et l'autre n'en sait rien");
  const dernier = a.recus.findLast((m) => m.t === "ressource") as Extract<MessageServeur, { t: "ressource" }>;
  assert.deepEqual(dernier, { t: "ressource", id: tas.id, disponible: true, reste: 6 });
  for (let k = 4; k < 10; k++) l.prendrePar(tas, 1, t0 + k * 1000);
  for (let k = 0; k < 10; k++) l.prendrePar(tas, 2, t0 + k * 1000);
  assert.equal(l.disponiblePour(tas, 1, t0 + 20_000), false, "vide pour lui");
  assert.equal(l.disponiblePour(tas, 2, t0 + 20_000), false);
  // Il revient 6 h après la première prise (B3), plein.
  assert.equal(REPOUSSE_MS.tas_bois, 6 * HEURE);
  assert.equal(l.disponiblePour(tas, 1, t0 + 6 * HEURE - 1), false);
  assert.equal(reste(1, t0 + 6 * HEURE), 10);
  // Le tic le dit à son joueur seulement, une fois.
  l.tick(t0 + 6 * HEURE + 5000, 0.1);
  l.tick(t0 + 6 * HEURE + 11_000, 0.1);
  assert.equal(a.recus.filter((m) => m.t === "ressource" && m.id === tas.id && m.disponible && m.reste === 10).length, 1);
  assert.equal(b.recus.filter((m) => m.t === "ressource" && m.id === tas.id && m.reste === 10).length, 1, "l'autre reçoit le retour du sien, une fois");
});

test("le butin personnel est gardé en base : un lieu rechargé s'en souvient", () => {
  const { base, definition, lieu: l } = lieu();
  const t0 = 1_000_000;
  const enclume = de(l, "piece_enclume")[0]!;
  l.prendrePar(enclume, 7, t0);
  const recharge = new LieuVivant(base, definition, () => 0.5);
  const r = recharge.ressources.get(enclume.id)!;
  assert.equal(recharge.disponiblePour(r, 7, t0 + HEURE), false);
  assert.equal(recharge.disponiblePour(r, 8, t0 + HEURE), true, "un autre a la sienne");
  // Une autre version du lieu : on repart plein.
  const v2 = new LieuVivant(base, { ...definition, version: 2 }, () => 0.5);
  assert.equal(v2.disponiblePour(v2.ressources.get(enclume.id)!, 7, t0 + HEURE), true);
});

test("le vrac grandit avec les voyageurs : +50 % par voyageur en plus, ×2 à trois, ×3 à cinq et pas plus", () => {
  assert.equal(facteurVrac(1), 1);
  assert.equal(facteurVrac(2), 1.5);
  assert.equal(facteurVrac(3), 2);
  assert.equal(facteurVrac(5), 3);
  assert.equal(facteurVrac(9), 3);
  assert.equal(vracEnJeu(12, 3), 24);
  const { lieu: l } = lieu();
  const t0 = 1_000_000;
  const enJeu = (id = 1) => l.vuePour(id, "voltaiques", t0).filter((r: RessourceSol) => r.type === "buche" && r.disponible).length;
  const v = Array.from({ length: 7 }, (_, i) => voyageur(i + 1));
  l.entrer(v[0]!);
  assert.equal(enJeu(), 4);
  l.entrer(v[1]!);
  l.entrer(v[2]!);
  assert.equal(enJeu(), 8, "à trois : ×2");
  l.entrer(v[3]!);
  l.entrer(v[4]!);
  assert.equal(enJeu(), 12, "à cinq : ×3");
  l.entrer(v[5]!);
  l.entrer(v[6]!);
  assert.equal(enJeu(), 12, "et pas plus");
  // Les points qui entrent en jeu sont annoncés à tous ; ceux qui en sortent aussi.
  l.tick(t0, 0.1);
  const annonces = v[0]!.recus.filter((m) => m.t === "ressource" && m.disponible).length;
  assert.equal(annonces, 8, "les 8 bûches en plus, annoncées au premier");
  for (const x of v.slice(1)) l.sortir(x);
  l.tick(t0 + 1000, 0.1);
  assert.equal(v[0]!.recus.filter((m) => m.t === "ressource" && !m.disponible).length, 8);
  assert.equal(enJeu(), 4);
  // Prise par l'un, une bûche en vrac l'est pour tous.
  const b = de(l, "buche")[0]!;
  l.prendrePar(b, 1, t0);
  assert.equal(l.disponiblePour(b, 2, t0), false);
});
