// La mise en scène du phare (0.10, K2) : le balayage du faisceau (lanterne allumée, la nuit), le recul de la caméra sur la
// tour à l'allumage (une fois, et il revient exactement au joueur), les feux du cargo dans les 40 dernières secondes, sa
// corne au large 10 s après l'allumage et juste avant le cadrage, le cadrage de la crique avant le choc (annulé si un Éteint est à moins de 6 m) ; avec
// la réduction des mouvements, ni recul ni cadrage, mais les feux et le son.

import { test } from "node:test";
import assert from "node:assert/strict";
import { CARGO_MS, type EtatPhareVu } from "../../commun/src/phare.ts";

// Une toile de dessin factice (les textures du décor se « dessinent » dans le vide), comme rendu/phare.test.ts.
const contexte2d: unknown = new Proxy(
  {},
  {
    get: (_c, nom) => {
      if (nom === "measureText") return () => ({ width: 10 });
      if (nom === "createLinearGradient" || nom === "createRadialGradient" || nom === "createPattern") return () => ({ addColorStop() {} });
      if (nom === "getImageData") return (_x: number, _y: number, l: number, h: number) => ({ data: new Uint8ClampedArray(l * h * 4) });
      return () => {};
    },
    set: () => true,
  },
);
if (!(globalThis as { document?: unknown }).document) Object.assign(globalThis, { document: { createElement: () => ({ width: 1, height: 1, style: {}, getContext: () => contexte2d }) } });

const { CADRAGE_CRIQUE, CORNES_CARGO_S, FEUX_CARGO, MiseEnScenePhare, RECUL_TOUR } = await import("./phare-scene.ts");
const { animerPhare, creerPhare } = await import("./rendu/phare.ts");
const { nuitDe } = await import("./rendu/phare-nuit.ts");

const ETEINTE: EtatPhareVu = { escabeau: "marque", bidon: "verse", prisme: "remis", lanterne: false, compresseur: true, corneSonnee: false };
const ALLUMEE: EtatPhareVu = { ...ETEINTE, lanterne: true };
const JOUEUR = { x: 20.5, z: 10.8, y: 0, zoom: 1 };
const CHOC = 0; // le choc tombe à l'échouage (SCENE_CARGO.choc)

test("le balayage du faisceau ne se voit que lanterne allumée, la nuit ; il tourne, posé sur le relief", () => {
  const decor = creerPhare();
  const balayage = nuitDe(decor)!.balayage;
  const voir = (lanterne: boolean, nuit: boolean) => {
    animerPhare(decor, 30, 4, 0.1, Math.PI / 4, { etat: lanterne ? ALLUMEE : ETEINTE, epave: false, nuit }, []);
    return balayage.visible;
  };
  assert.equal(voir(false, false), false);
  assert.equal(voir(false, true), false, "lanterne éteinte");
  assert.equal(voir(true, false), false, "le jour");
  assert.equal(voir(true, true), true);
  const pos = balayage.geometry.getAttribute("position");
  const avant = [pos.getX(20), pos.getZ(20)];
  voir(true, true);
  assert.notDeepEqual([pos.getX(20), pos.getZ(20)], avant, "il tourne");
  // Sur le plateau à 0, sur la mer à − 9 (jamais au fond de l'eau).
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < pos.count; i++) {
    min = Math.min(min, pos.getY(i));
    max = Math.max(max, pos.getY(i));
  }
  assert.ok(min >= -9 && max <= 0.2, `${min} à ${max}`);
});

test("la caméra recule sur la tour une fois, à l'allumage, et revient exactement au joueur", () => {
  const m = new MiseEnScenePhare(() => false);
  // À l'arrivée, la lanterne déjà allumée : pas de recul.
  m.recevoir(null, ALLUMEE, 0);
  assert.equal(m.cadrage(500, JOUEUR, false), null);
  const m2 = new MiseEnScenePhare(() => false);
  m2.recevoir(null, ETEINTE, 0);
  m2.recevoir(ETEINTE, ALLUMEE, 1000);
  const duree = (RECUL_TOUR.aller + RECUL_TOUR.reste + RECUL_TOUR.retour) * 1000;
  const milieu = m2.cadrage(1000 + duree / 2, JOUEUR, false)!;
  assert.deepEqual(milieu, { x: RECUL_TOUR.x, z: RECUL_TOUR.z, y: RECUL_TOUR.y, zoom: RECUL_TOUR.zoom });
  // Au bout du retour, on est revenu au joueur (le dernier cadrage s'en approche), puis plus rien.
  const presque = m2.cadrage(1000 + duree - 20, JOUEUR, false)!;
  assert.ok(Math.hypot(presque.x - JOUEUR.x, presque.z - JOUEUR.z) < 0.05 && Math.abs(presque.zoom - JOUEUR.zoom) < 0.01);
  assert.equal(m2.cadrage(1000 + duree, JOUEUR, false), null);
  // L'état suivant (la lanterne toujours allumée) ne le rejoue pas.
  m2.recevoir(ALLUMEE, ALLUMEE, 1000 + duree + 100);
  assert.equal(m2.cadrage(1000 + duree + 1500, JOUEUR, false), null);
});

test("le cargo, 50 s après l'allumage : sa corne à 10 s et juste avant le cadrage, ses feux dès la première corne, la crique cadrée avant le choc", () => {
  assert.equal(CARGO_MS, 50_000, "le réglage du porteur (2026-10-15)");
  const m = new MiseEnScenePhare(() => false);
  m.recevoir(ETEINTE, { ...ALLUMEE, cargoDans: CARGO_MS }, 0);
  const cornes: number[] = [];
  for (let t = 0; t <= CARGO_MS; t += 500) cornes.push(...m.cornesAJouer(t).map(() => t / 1000));
  const debut = CARGO_MS + CHOC - CADRAGE_CRIQUE.avantChoc * 1000;
  assert.equal(cornes[0], 10);
  assert.equal(cornes.length, 2);
  assert.ok(cornes[1]! * 1000 <= debut && cornes[1]! * 1000 > debut - 3000, `la seconde corne (${cornes[1]} s) juste avant le cadrage (${debut / 1000} s)`);
  assert.ok(m.corneProcheJouee);
  assert.equal(m.feux(9_000, false), null, "pas encore");
  const loin = m.feux(11_000, false)!;
  const pres = m.feux(CARGO_MS - 5_000, false)!;
  assert.ok(loin && pres);
  assert.ok(Math.hypot(pres.x - FEUX_CARGO.arrivee.x, pres.z - FEUX_CARGO.arrivee.z) < Math.hypot(loin.x - FEUX_CARGO.arrivee.x, loin.z - FEUX_CARGO.arrivee.z), "ils approchent");
  // 7 s avant le choc, la crique est cadrée ; pas avant.
  assert.equal(m.cadrage(debut - 100, JOUEUR, false), null);
  const c = m.cadrage(debut + 2000, JOUEUR, false)!;
  assert.deepEqual([c.x, c.z, c.y, c.zoom], [CADRAGE_CRIQUE.x, CADRAGE_CRIQUE.z, CADRAGE_CRIQUE.y, CADRAGE_CRIQUE.zoom]);
  // L'échouage annoncé (un peu en retard) : on reste sur la crique jusqu'au bout de la scène, puis on revient.
  const arrive = CARGO_MS + 400;
  m.echouage(arrive);
  assert.ok(m.cadrage(arrive + 2000, JOUEUR, false));
  assert.equal(m.cadrage(arrive + 3500, JOUEUR, false), null);
  // L'épave revenue du fondu : plus de feux.
  assert.equal(m.feux(arrive + 1500, true), null);
});

test("un Éteint à moins de 6 m annule le cadrage de la crique (et il ne reprend pas)", () => {
  const m = new MiseEnScenePhare(() => false);
  m.recevoir(ETEINTE, { ...ALLUMEE, cargoDans: CARGO_MS }, 0);
  const debut = CARGO_MS + CHOC - CADRAGE_CRIQUE.avantChoc * 1000;
  assert.ok(m.cadrage(debut + 500, JOUEUR, false));
  assert.equal(m.cadrage(debut + 600, JOUEUR, true), null);
  assert.equal(m.cadrage(debut + 2000, JOUEUR, false), null, "il ne reprend pas");
  // Le recul de l'allumage aussi.
  const r = new MiseEnScenePhare(() => false);
  r.recevoir(ETEINTE, ALLUMEE, 0);
  assert.equal(r.cadrage(1000, JOUEUR, true), null);
  assert.equal(r.cadrage(1500, JOUEUR, false), null);
});

test("avec la réduction des mouvements : ni recul ni cadrage ; les feux et la corne, si", () => {
  const m = new MiseEnScenePhare(() => true);
  m.recevoir(ETEINTE, { ...ALLUMEE, cargoDans: CARGO_MS }, 0);
  for (let t = 0; t <= CARGO_MS + 10_000; t += 250) assert.equal(m.cadrage(t, JOUEUR, false), null);
  assert.ok(m.feux(30_000, false));
  const m2 = new MiseEnScenePhare(() => true);
  m2.recevoir(ETEINTE, { ...ALLUMEE, cargoDans: CARGO_MS }, 0);
  assert.equal(m2.cornesAJouer(10_500).length, 1);
});

test("qui arrive après le cargo (ou se reconnecte) trouve l'épave : rien ne se joue ; qui arrive pendant l'approche la voit finir", () => {
  const m = new MiseEnScenePhare(() => false);
  m.recevoir(null, ALLUMEE, 0);
  assert.deepEqual(m.cornesAJouer(1000), []);
  assert.equal(m.feux(1000, true), null);
  assert.equal(m.cadrage(1000, JOUEUR, false), null);
  // Arrivé 30 s avant l'échouage : la corne de l'allumage ne sonne pas après coup, celle d'avant le cadrage, si.
  const n = new MiseEnScenePhare(() => false);
  n.recevoir(null, { ...ALLUMEE, cargoDans: 30_000 }, 0);
  const cornes: number[] = [];
  for (let t = 0; t <= 30_000; t += 500) cornes.push(...n.cornesAJouer(t));
  assert.deepEqual(cornes, [CORNES_CARGO_S[1]]);
  assert.ok(n.feux(1000, false));
});

test("le choc et la secousse tombent à CARGO_MS (50 s) après l'allumage, la seconde corne et le cadrage avant", async () => {
  const { PhareClient } = await import("./phare.ts");
  const { Secousse } = await import("./rendu/secousse.ts");
  const vrai = performance.now.bind(performance);
  let t = 0;
  Object.defineProperty(performance, "now", { value: () => t, configurable: true, writable: true });
  try {
    const sons: [string, number][] = [];
    const client = new PhareClient((id) => sons.push([id, t]), () => ({}) as HTMLElement, new Secousse(() => false), new MiseEnScenePhare(() => false));
    client.recevoir({ t: "phare", etat: ETEINTE });
    client.recevoir({ t: "phare", etat: { ...ALLUMEE, cargoDans: CARGO_MS } });
    let cadreLe: number | null = null;
    for (t = 0; t < CARGO_MS; t += 100) {
      client.animer();
      // Le cadrage de la crique (plus bas que le joueur ; le recul sur la tour, à l'allumage, regarde en haut).
      const c = client.cadrage({ x: 20, z: 35 }, 1, []);
      if (cadreLe === null && c && (c.y ?? 0) < 0) cadreLe = t;
    }
    // Le serveur bascule à CARGO_MS : le choc et la secousse à cette image même.
    t = CARGO_MS;
    client.recevoir({ t: "phare", etat: { ...ALLUMEE, cargoDans: 0 }, cargo: true });
    client.animer();
    const choc = sons.find(([id]) => id === "choc_cargo");
    assert.equal(choc?.[1], CARGO_MS);
    assert.ok(client.secousse.enCours);
    const cornes = sons.filter(([id]) => id === "corne_cargo").map(([, q]) => q);
    assert.equal(cornes.length, 2, "pas de troisième corne au choc");
    assert.equal(cornes[0], 10_000);
    assert.ok(cadreLe !== null && Math.abs(cadreLe - (CARGO_MS - 7000)) <= 100, `cadrage à ${cadreLe} ms`);
    assert.ok(cornes[1]! < cadreLe!, "la seconde corne juste avant le cadrage");
  } finally {
    Object.defineProperty(performance, "now", { value: vrai, configurable: true, writable: true });
  }
});
