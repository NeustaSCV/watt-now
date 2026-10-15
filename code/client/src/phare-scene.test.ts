// La mise en scène du phare (0.10, K2 puis K4) : le balayage du faisceau (lanterne allumée, la nuit), le recul de la caméra
// sur la tour à l'allumage (une fois, et il revient exactement au joueur ; annulé par un Éteint à moins de 6 m), les feux
// du cargo dans les 40 dernières secondes, sa corne au large 10 s après l'allumage et 8 s avant l'échouage ; plus de
// cadrage de la crique (K4) : à CARGO_MS, la scène de l'échouage (la maquette validée, variante 1), ≈ 6,6 s, puis l'épave.

import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { CARGO_MS, SCENE_CARGO_MS, type EtatPhareVu } from "../../commun/src/phare.ts";

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

const { FEUX_CARGO, MiseEnScenePhare, RECUL_TOUR, SCENE_CARGO, momentCargo } = await import("./phare-scene.ts");
const { animerPhare, creerPhare } = await import("./rendu/phare.ts");
const { nuitDe } = await import("./rendu/phare-nuit.ts");
const { PhareClient } = await import("./phare.ts");

const ETEINTE: EtatPhareVu = { escabeau: "marque", bidon: "verse", prisme: "remis", lanterne: false, compresseur: true, corneSonnee: false };
const ALLUMEE: EtatPhareVu = { ...ETEINTE, lanterne: true };
const JOUEUR = { x: 20.5, z: 10.8, y: 0, zoom: 1 };

/** Remplace performance.now le temps d'un essai (le client compte en ms de performance.now). */
async function aLHeure(f: (regler: (ms: number) => void) => void | Promise<void>): Promise<void> {
  const vrai = performance.now.bind(performance);
  let t = 0;
  Object.defineProperty(performance, "now", { value: () => t, configurable: true, writable: true });
  try {
    await f((ms) => (t = ms));
  } finally {
    Object.defineProperty(performance, "now", { value: vrai, configurable: true, writable: true });
  }
}

/** Une fausse scène de l'échouage : elle note ce qu'on lui demande. */
function fausseScene() {
  const journal = { preparee: 0, commencee: [] as number[], rendus: [] as number[], arretee: 0, moments: [] as ReturnType<typeof momentCargo>[] };
  return {
    journal,
    pret: true,
    preparer: () => void journal.preparee++,
    commencer: (depuis: number) => void journal.commencee.push(depuis),
    montrer: (m: ReturnType<typeof momentCargo>) => void journal.moments.push(m),
    rendre: (t: number) => (journal.rendus.push(t), true),
    finPlan: () => {},
    arreter: () => void journal.arretee++,
  };
}

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
  assert.deepEqual(milieu, { x: RECUL_TOUR.x, z: RECUL_TOUR.z, y: RECUL_TOUR.y, zoom: RECUL_TOUR.zoom, degage: true });
  // Au bout du retour, on est revenu au joueur (le dernier cadrage s'en approche), puis plus rien.
  const presque = m2.cadrage(1000 + duree - 20, JOUEUR, false)!;
  assert.ok(Math.hypot(presque.x - JOUEUR.x, presque.z - JOUEUR.z) < 0.05 && Math.abs(presque.zoom - JOUEUR.zoom) < 0.01);
  assert.equal(m2.cadrage(1000 + duree, JOUEUR, false), null);
  // L'état suivant (la lanterne toujours allumée) ne le rejoue pas.
  m2.recevoir(ALLUMEE, ALLUMEE, 1000 + duree + 100);
  assert.equal(m2.cadrage(1000 + duree + 1500, JOUEUR, false), null);
});

test("le cargo, 50 s après l'allumage : sa corne à 10 s et 8 s avant l'échouage, ses feux dès la première corne ; plus de cadrage de la crique", () => {
  assert.equal(CARGO_MS, 50_000, "le réglage du porteur (2026-10-15)");
  const m = new MiseEnScenePhare(() => false);
  m.recevoir(ETEINTE, { ...ALLUMEE, cargoDans: CARGO_MS }, 0);
  const cornes: number[] = [];
  for (let t = 0; t <= CARGO_MS; t += 500) cornes.push(...m.cornesAJouer(t).map(() => t / 1000));
  assert.deepEqual(cornes, [10, 42]);
  assert.equal(m.feux(9_000, false), null, "pas encore");
  const loin = m.feux(11_000, false)!;
  const pres = m.feux(CARGO_MS - 5_000, false)!;
  assert.ok(loin && pres);
  assert.ok(Math.hypot(pres.x - FEUX_CARGO.arrivee.x, pres.z - FEUX_CARGO.arrivee.z) < Math.hypot(loin.x - FEUX_CARGO.arrivee.x, loin.z - FEUX_CARGO.arrivee.z), "ils approchent");
  // K4 : le cadrage de la crique n'existe plus (ni avant le choc, ni après, Éteint proche ou non).
  for (let t = 5_000; t <= CARGO_MS + 10_000; t += 250) {
    if (t === CARGO_MS + 400) m.echouage(t);
    assert.equal(m.cadrage(t, JOUEUR, false), null, `pas de cadrage à ${t} ms`);
    assert.equal(m.cadrage(t, JOUEUR, true), null);
  }
  // L'épave revenue au personnage : plus de feux.
  assert.equal(m.feux(CARGO_MS + 6_000, true), null);
});

test("un Éteint à moins de 6 m annule le recul sur la tour (et il ne reprend pas)", () => {
  const r = new MiseEnScenePhare(() => false);
  r.recevoir(ETEINTE, ALLUMEE, 0);
  assert.ok(r.cadrage(500, JOUEUR, false));
  assert.equal(r.cadrage(1000, JOUEUR, true), null);
  assert.equal(r.cadrage(1500, JOUEUR, false), null);
});

test("avec la réduction des mouvements : pas de recul ; les feux et la corne, si", () => {
  const m = new MiseEnScenePhare(() => true);
  m.recevoir(ETEINTE, { ...ALLUMEE, cargoDans: CARGO_MS }, 0);
  for (let t = 0; t <= CARGO_MS + 10_000; t += 250) assert.equal(m.cadrage(t, JOUEUR, false), null);
  assert.ok(m.feux(30_000, false));
  const m2 = new MiseEnScenePhare(() => true);
  m2.recevoir(ETEINTE, { ...ALLUMEE, cargoDans: CARGO_MS }, 0);
  assert.equal(m2.cornesAJouer(10_500).length, 1);
});

test("le minutage de la scène est celui de la maquette : 6,6 s, le noir, les bandes, le plan, le retour à l'épave", () => {
  assert.equal(SCENE_CARGO.fin * 1000, SCENE_CARGO_MS);
  assert.deepEqual(momentCargo(0), { plan: false, noir: 0, bandes: false, epave: false, fini: false }, "la vue du jeu, d'abord");
  assert.ok(momentCargo(0.4).bandes && !momentCargo(0.4).plan, "les bandes, sur la vue du jeu");
  assert.ok(Math.abs(momentCargo(0.6).noir - 0.5) < 1e-9, "le fondu au noir");
  assert.ok(momentCargo(0.75).plan && Math.abs(momentCargo(0.75).noir - 1) < 1e-9, "le plan commence dans le noir");
  assert.equal(momentCargo(2).noir, 0);
  assert.ok(momentCargo(SCENE_CARGO.choc).plan);
  assert.ok(momentCargo(5.8).plan && momentCargo(5.8).noir > 0.5, "le noir de la fin");
  assert.ok(!momentCargo(5.9).plan && momentCargo(5.9).epave, "le retour au personnage, devant l'épave");
  assert.ok(!momentCargo(6.3).bandes && momentCargo(6.3).noir === 0);
  assert.ok(momentCargo(6.6).fini && !momentCargo(6.59).fini);
});

test("la scène commence à CARGO_MS (l'annonce du serveur) et dure ce qu'elle dure ; préparée pendant l'approche ; l'épave après", async () => {
  await aLHeure((regler) => {
    const cine = fausseScene();
    const sons: string[] = [];
    const client = new PhareClient((id) => sons.push(id), () => ({}) as HTMLElement, new MiseEnScenePhare(() => false), cine);
    client.recevoir({ t: "phare", etat: ETEINTE });
    assert.equal(cine.journal.preparee, 0);
    client.recevoir({ t: "phare", etat: { ...ALLUMEE, cargoDans: CARGO_MS } });
    assert.equal(cine.journal.preparee, 1, "préparée dès l'approche");
    for (let t = 0; t < CARGO_MS; t += 100) {
      regler(t);
      client.animer();
      assert.equal(client.dessinerScene(), false, "avant l'échouage : la vue du jeu");
    }
    assert.equal(client.scene({ epave: false }).epave, false);
    // Le serveur bascule à CARGO_MS : la scène commence.
    regler(CARGO_MS);
    client.recevoir({ t: "phare", etat: ALLUMEE, cargo: true });
    assert.deepEqual(cine.journal.commencee, [0]);
    const plan: number[] = [];
    let epaveLe: number | null = null;
    for (let t = CARGO_MS; t <= CARGO_MS + SCENE_CARGO_MS + 200; t += 50) {
      regler(t);
      client.animer();
      if (client.dessinerScene()) plan.push(t - CARGO_MS);
      if (epaveLe === null && client.scene({ epave: true }).epave) epaveLe = t - CARGO_MS;
    }
    assert.equal(plan[0], 750, "le plan après le fondu au noir");
    assert.equal(plan[plan.length - 1], 5850, "jusqu'au noir de la fin");
    assert.equal(epaveLe, 5900, "l'épave au retour au personnage");
    assert.equal(cine.journal.arretee, 1, "finie et libérée");
    assert.ok(!client.enScene);
    assert.deepEqual(sons.filter((s) => s === "corne_cargo").length, 2, "les deux cornes de l'approche, pas de troisième");
    assert.ok(!sons.includes("choc_cargo"), "le choc est celui de la scène");
  });
});

test("qui arrive après le cargo (ou se reconnecte) trouve l'épave : rien ne se joue ; qui arrive pendant l'approche voit la fin des feux, puis la scène", async () => {
  const m = new MiseEnScenePhare(() => false);
  m.recevoir(null, ALLUMEE, 0);
  assert.deepEqual(m.cornesAJouer(1000), []);
  assert.equal(m.feux(1000, true), null);
  await aLHeure((regler) => {
    const cine = fausseScene();
    const client = new PhareClient(() => {}, () => ({}) as HTMLElement, new MiseEnScenePhare(() => false), cine);
    regler(1000);
    client.recevoir({ t: "phare", etat: ALLUMEE });
    client.animer();
    assert.equal(cine.journal.preparee, 0);
    assert.equal(client.dessinerScene(), false);
    assert.equal(client.scene({ epave: true }).epave, true, "l'épave tout de suite");
    // Arrivé 30 s avant l'échouage : la corne de l'allumage ne sonne pas après coup, celle de la fin, si ; puis la scène.
    const sons: string[] = [];
    const cine2 = fausseScene();
    const n = new PhareClient((id) => sons.push(id), () => ({}) as HTMLElement, new MiseEnScenePhare(() => false), cine2);
    regler(0);
    n.recevoir({ t: "phare", etat: { ...ALLUMEE, cargoDans: 30_000 } });
    assert.equal(cine2.journal.preparee, 1);
    for (let t = 0; t < 30_000; t += 500) {
      regler(t);
      n.animer();
    }
    assert.deepEqual(sons, ["corne_cargo"]);
    assert.ok(n.scene({ epave: false }).feux, "la fin des feux");
    regler(30_000);
    n.recevoir({ t: "phare", etat: ALLUMEE, cargo: true });
    regler(32_000);
    n.animer();
    assert.ok(n.dessinerScene(), "puis la scène");
  });
});

test("quitter le phare pendant la scène l'arrête net (tout est retiré)", async () => {
  await aLHeure((regler) => {
    const cine = fausseScene();
    const client = new PhareClient(() => {}, () => ({}) as HTMLElement, new MiseEnScenePhare(() => false), cine);
    client.recevoir({ t: "phare", etat: { ...ALLUMEE, cargoDans: 0 } });
    client.recevoir({ t: "phare", etat: ALLUMEE, cargo: true });
    regler(2000);
    assert.ok(client.dessinerScene());
    client.poser(false, { epave: true }, 0.016, { personnage: null, eteints: [], cercles: [], scene: { hauteurSuivie: 0 } });
    assert.equal(cine.journal.arretee, 1);
    assert.equal(client.dessinerScene(), false);
  });
});

test("la scène de la maquette (variante 1) : le cargo dans l'image, il s'écrase au centre, la poupe coule ; la secousse coupée si les mouvements sont réduits", async () => {
  const { creerSceneCargo } = await import("./rendu/cargo/scene-cargo.js");
  const avecSecousse = creerSceneCargo(SCENE_CARGO, { secousse: () => true });
  const sans = creerSceneCargo(SCENE_CARGO, { secousse: () => false });
  const W = 375;
  const H = 630;
  // Où tombe un point du monde dans l'image (−1 à 1 sur chaque axe).
  const dansLImage = (s: typeof sans, p: THREE.Vector3) => {
    s.camera.updateMatrixWorld();
    return p.clone().project(s.camera);
  };
  const centre = (o: THREE.Object3D) => new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());
  // Au début du plan, le cargo arrive par le bas, à droite ; au choc, il est au milieu de l'image.
  sans.poser(SCENE_CARGO.noir, W, H);
  const debut = dansLImage(sans, centre(sans.cargo.arriere));
  assert.ok(debut.x > 0 && debut.y < 0 && Math.abs(debut.x) < 1.2 && Math.abs(debut.y) < 1.4, `au début : (${debut.x.toFixed(2)}, ${debut.y.toFixed(2)})`);
  sans.poser(SCENE_CARGO.choc, W, H);
  const etrave = dansLImage(sans, centre(sans.cargo.avant));
  assert.ok(Math.abs(etrave.x) < 0.6 && Math.abs(etrave.y) < 0.6, `l'étrave au choc : (${etrave.x.toFixed(2)}, ${etrave.y.toFixed(2)})`);
  // La poupe se casse et s'enfonce (elle gîte), l'avant reste posé.
  const yPoupe = sans.cargo.arriere.position.y;
  sans.poser(SCENE_CARGO.retour - 0.01, W, H);
  assert.ok(sans.cargo.arriere.position.y < yPoupe - 0.8, "la poupe s'enfonce");
  assert.ok(Math.abs(sans.cargo.arriere.rotation.z) > 0.1, "elle gîte");
  // La secousse : la caméra bouge au choc ; pas avec la réduction des mouvements.
  avecSecousse.poser(SCENE_CARGO.choc + 0.05, W, H);
  sans.poser(SCENE_CARGO.choc + 0.05, W, H);
  assert.ok(avecSecousse.camera.position.distanceTo(sans.camera.position) > 0.05);
  sans.poser(SCENE_CARGO.noir, W, H);
  const fixe = sans.camera.position.clone();
  sans.poser(SCENE_CARGO.choc + 0.05, W, H);
  assert.ok(sans.camera.position.distanceTo(fixe) < 1e-9, "la caméra ne tremble pas");
});
