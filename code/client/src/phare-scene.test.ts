// La mise en scène du phare (0.10, K2) : le balayage du faisceau (lanterne allumée, la nuit), le recul de la caméra sur la
// tour à l'allumage (une fois, et il revient exactement au joueur), les feux du cargo dans les 40 dernières secondes, sa
// corne au large 10 s après l'allumage et à 110 s, le cadrage de la crique avant le choc (annulé si un Éteint est à moins de 6 m) ; avec
// la réduction des mouvements, ni recul ni cadrage, mais les feux et le son.

import { test } from "node:test";
import assert from "node:assert/strict";
import type { EtatPhareVu } from "../../commun/src/phare.ts";

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

const { CADRAGE_CRIQUE, FEUX_CARGO, MiseEnScenePhare, RECUL_TOUR } = await import("./phare-scene.ts");
const { animerPhare, creerPhare } = await import("./rendu/phare.ts");
const { nuitDe } = await import("./rendu/phare-nuit.ts");

const ETEINTE: EtatPhareVu = { escabeau: "marque", bidon: "verse", prisme: "remis", lanterne: false, compresseur: true, corneSonnee: false };
const ALLUMEE: EtatPhareVu = { ...ETEINTE, lanterne: true };
const JOUEUR = { x: 20.5, z: 10.8, y: 0, zoom: 1 };
const CHOC = 3800;

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

test("le cargo : sa corne 10 s après l'allumage et à 110 s, ses feux dans les 40 dernières secondes, la crique cadrée avant le choc", () => {
  const m = new MiseEnScenePhare(() => false);
  m.recevoir(ETEINTE, { ...ALLUMEE, cargoDans: 120_000 }, 0);
  const cornes: number[] = [];
  for (let t = 0; t <= 120_000; t += 500) cornes.push(...m.cornesAJouer(t).map(() => t / 1000));
  assert.deepEqual(cornes, [10, 110]);
  assert.ok(m.corneProcheJouee);
  assert.equal(m.feux(79_000, false), null, "pas encore");
  const loin = m.feux(81_000, false)!;
  const pres = m.feux(115_000, false)!;
  assert.ok(loin && pres);
  assert.ok(Math.hypot(pres.x - FEUX_CARGO.arrivee.x, pres.z - FEUX_CARGO.arrivee.z) < Math.hypot(loin.x - FEUX_CARGO.arrivee.x, loin.z - FEUX_CARGO.arrivee.z), "ils approchent");
  // 7 s avant le choc, la crique est cadrée ; pas avant.
  const debut = 120_000 + CHOC - CADRAGE_CRIQUE.avantChoc * 1000;
  assert.equal(m.cadrage(debut - 100, JOUEUR, false), null);
  const c = m.cadrage(debut + 2000, JOUEUR, false)!;
  assert.deepEqual([c.x, c.z, c.y, c.zoom], [CADRAGE_CRIQUE.x, CADRAGE_CRIQUE.z, CADRAGE_CRIQUE.y, CADRAGE_CRIQUE.zoom]);
  // L'échouage annoncé (un peu en retard) : on reste sur la crique jusqu'au bout de la scène, puis on revient.
  m.echouage(120_400);
  assert.ok(m.cadrage(120_400 + 6000, JOUEUR, false));
  assert.equal(m.cadrage(120_400 + 7300, JOUEUR, false), null);
  // L'épave revenue du fondu : plus de feux.
  assert.equal(m.feux(120_400 + 5300, true), null);
});

test("un Éteint à moins de 6 m annule le cadrage de la crique (et il ne reprend pas)", () => {
  const m = new MiseEnScenePhare(() => false);
  m.recevoir(ETEINTE, { ...ALLUMEE, cargoDans: 120_000 }, 0);
  const debut = 120_000 + CHOC - CADRAGE_CRIQUE.avantChoc * 1000;
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
  m.recevoir(ETEINTE, { ...ALLUMEE, cargoDans: 120_000 }, 0);
  for (let t = 0; t <= 130_000; t += 250) assert.equal(m.cadrage(t, JOUEUR, false), null);
  assert.ok(m.feux(100_000, false));
  const m2 = new MiseEnScenePhare(() => true);
  m2.recevoir(ETEINTE, { ...ALLUMEE, cargoDans: 120_000 }, 0);
  assert.deepEqual(m2.cornesAJouer(10_500), [110]);
});

test("qui arrive après le cargo (ou se reconnecte) trouve l'épave : rien ne se joue ; qui arrive pendant l'approche la voit finir", () => {
  const m = new MiseEnScenePhare(() => false);
  m.recevoir(null, ALLUMEE, 0);
  assert.deepEqual(m.cornesAJouer(1000), []);
  assert.equal(m.feux(1000, true), null);
  assert.equal(m.cadrage(1000, JOUEUR, false), null);
  // Arrivé 30 s avant l'échouage : la corne de l'allumage ne sonne pas après coup, celle des 10 dernières secondes, si.
  const n = new MiseEnScenePhare(() => false);
  n.recevoir(null, { ...ALLUMEE, cargoDans: 30_000 }, 0);
  const cornes: number[] = [];
  for (let t = 0; t <= 30_000; t += 500) cornes.push(...n.cornesAJouer(t));
  assert.deepEqual(cornes, [10]);
  assert.ok(n.feux(1000, false));
});
