// Plan 0.10, chantier K : le phare du cap à l'écran. Le relief (L-1) : un personnage descend la rampe du canot, saute le
// tronçon effondré et marche sur la grève à la bonne hauteur (la fonction de pose, sur `hauteurSol` du modèle) ; avec
// l'épave, le pont du cargo est à − 4. Le décor se construit sans navigateur (une toile de dessin factice), tient le budget
// de l'iPhone sans l'épave comme avec, et suit l'état du phare (la lanterne, le prisme, l'escabeau, l'épave).

import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";

// Une toile de dessin factice : les textures des enseignes et des avis se « dessinent » dans le vide.
const contexte2d: unknown = new Proxy(
  {},
  {
    get: (_cible, nom) => {
      if (nom === "measureText") return () => ({ width: 10 });
      if (nom === "createLinearGradient" || nom === "createRadialGradient" || nom === "createPattern") return () => ({ addColorStop() {} });
      if (nom === "getImageData") return (_x: number, _y: number, l: number, h: number) => ({ data: new Uint8ClampedArray(l * h * 4) });
      return () => {};
    },
    set: () => true,
  },
);
if (!(globalThis as { document?: unknown }).document) Object.assign(globalThis, { document: { createElement: () => ({ width: 1, height: 1, style: {}, getContext: () => contexte2d }) } });

const { avancer } = await import("../../../commun/src/deplacement.ts");
const { ENDROITS_PHARE, jeu, zonePhare } = await import("../../../commun/src/phare.ts");
const { EPAVE_MODELE } = await import("../../../commun/src/phare-modele.ts");
const { animerPhare, creerPhare, solPhare } = await import("./phare.ts");
const { PhareClient } = await import("../phare.ts");

/** Ce que l'écran dessine : les maillages visibles qui écrivent la couleur (pas ceux qui ne portent qu'une ombre). */
function compter(decor: THREE.Object3D): { triangles: number; appels: number } {
  let triangles = 0;
  let appels = 0;
  decor.traverseVisible((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || (m.material as THREE.Material).colorWrite === false) return;
    const g = m.geometry;
    triangles += (g.index ? g.index.count : g.getAttribute("position").count) / 3;
    appels++;
  });
  return { triangles, appels };
}

/** Un personnage posé par le client du phare (la fonction de pose de client/src/phare.ts). */
function poseur() {
  const client = new PhareClient(() => {}, () => ({}) as HTMLElement);
  const personnage = new THREE.Object3D();
  const scene = { hauteurSuivie: 0 };
  const poser = (x: number, z: number, epave = false, dt = 1) => {
    personnage.position.set(x, 0, z);
    client.poser(true, { epave }, dt, { personnage, eteints: [], cercles: [], scene });
    return personnage.position.y;
  };
  return { client, personnage, scene, poser };
}

test("un personnage descend la rampe du canot, saute le tronçon effondré et marche sur la grève à la bonne hauteur", () => {
  const zone = zonePhare({ epave: false });
  const { poser, scene } = poseur();
  // Sur le plateau, devant le hangar : à plat.
  let pos = { x: ENDROITS_PHARE.sautDe.x, z: jeu(0, 11.5).z, o: 0 };
  assert.ok(Math.abs(poser(pos.x, pos.z)) < 0.05);
  // La partie haute de la rampe (≈ 37°) : on descend, de plus en plus bas, jusqu'au bord du trou (≈ − 5).
  let avant = 0;
  for (let i = 0; i < 120; i++) {
    pos = avancer(pos, { dx: 0, dz: 1, allure: "marche" }, 0.05, zone);
    const y = poser(pos.x, pos.z);
    assert.ok(y <= avant + 1e-6, "on descend");
    avant = y;
  }
  assert.ok(avant < -4.5 && avant > -5.3, `au bord du trou : ${avant.toFixed(2)}`);
  // La pente : 37° environ (5,15 m pour 6,95 m).
  assert.ok(Math.abs((Math.atan2(5.15, 18.95 - 12) * 180) / Math.PI - 36.5) < 1.5);
  // Le saut : on retombe sur la partie basse, affaissée (≈ − 7).
  pos = { ...ENDROITS_PHARE.sautVers, o: 0 };
  const apres = poser(pos.x, pos.z);
  assert.ok(apres < -6.5 && apres > -7.3, `après le saut : ${apres.toFixed(2)}`);
  // On descend au bout de la partie basse, puis on pose le pied sur les galets, à l'ouest.
  for (let i = 0; i < 40; i++) pos = avancer(pos, { dx: 0, dz: 1, allure: "marche" }, 0.05, zone);
  for (let i = 0; i < 60; i++) pos = avancer(pos, { dx: -1, dz: 0, allure: "marche" }, 0.05, zone);
  assert.ok(pos.x < jeu(-26, 0).x, "sur la grève, à l'ouest de la rampe");
  let y = 0;
  for (let i = 0; i < 30; i++) y = poser(pos.x, pos.z, false, 0.05);
  assert.ok(y < -8.6 && y > -9.1, `sur les galets : ${y.toFixed(2)}`);
  // On longe la grève vers l'ouest, jusqu'à la sortie : toujours sur les galets ; la caméra suit.
  for (let i = 0; i < 80; i++) {
    pos = avancer(pos, { dx: -1, dz: -0.3, allure: "marche" }, 0.05, zone);
    y = poser(pos.x, pos.z, false, 0.05);
  }
  assert.ok(y < -8.5 && y > -9.1, `au bout de la grève : ${y.toFixed(2)}`);
  assert.equal(scene.hauteurSuivie, y);
});

test("avec l'épave : le pont du cargo est à − 4, l'échelle de coupée descend aux galets ; sans elle, la grève", () => {
  const pont = jeu(-5, 20);
  assert.ok(Math.abs(solPhare(pont.x, pont.z, true) + 4.1) < 0.3);
  assert.ok(solPhare(pont.x, pont.z, false) < -8.5);
  // L'échelle de coupée (FICHE.epave.echelle), un pas en deçà de ses deux bouts.
  const { bas: b, haut: h } = EPAVE_MODELE.echelle;
  const bas = jeu(b.x + (h.x - b.x) * 0.05, b.z + (h.z - b.z) * 0.05);
  const haut = jeu(b.x + (h.x - b.x) * 0.95, b.z + (h.z - b.z) * 0.95);
  assert.ok(solPhare(bas.x, bas.z, true) < -8);
  assert.ok(solPhare(haut.x, haut.z, true) > -4.6);
  // Le plateau et la marque à la craie : à plat.
  assert.ok(Math.abs(solPhare(ENDROITS_PHARE.marque.x, ENDROITS_PHARE.marque.z, true)) < 0.05);
});

test("la pose suit la hauteur en douceur (la rampe), et d'un coup quand on change de lieu ; ailleurs, tout est à plat", () => {
  const { client, personnage, scene, poser } = poseur();
  const greve = jeu(-20, 20);
  assert.ok(poser(greve.x, greve.z) < -8.5, "on arrive : posé d'un coup");
  const eteint = { objet: new THREE.Object3D() };
  eteint.objet.position.set(greve.x, 0, greve.z);
  const visee = new THREE.Object3D();
  visee.position.set(greve.x, 0.03, greve.z);
  client.poser(true, { epave: false }, 0.016, { personnage, eteints: [eteint], cercles: [visee], scene });
  assert.ok(eteint.objet.position.y < -8.5, "l'Éteint sur les galets");
  assert.ok(visee.position.y < -8.4, "le cercle de visée aussi");
  client.poser(false, {}, 0.016, { personnage, eteints: [], cercles: [], scene });
  assert.equal(scene.hauteurSuivie, 0);
});

test("budget iPhone : le décor du phare tient sous 60 000 triangles et 40 appels, épave comprise", () => {
  const decor = creerPhare();
  const sans = compter(decor);
  const vu = { etat: { escabeau: "hangar" as const, bidon: "cuve" as const, prisme: "tombe" as const, lanterne: false, compresseur: false, corneSonnee: false }, epave: true };
  animerPhare(decor, 30, 4, 0.016, Math.PI / 4, vu, []);
  const avec = compter(decor);
  assert.ok(sans.appels <= 40 && avec.appels <= 40, `${sans.appels} et ${avec.appels} appels`);
  assert.ok(avec.triangles <= 60_000, `${avec.triangles} triangles`);
  assert.ok(avec.appels > sans.appels, "l'épave se dessine");
});

test("le décor suit l'état du phare : la lanterne, le prisme, le bidon, l'escabeau, la courroie, l'épave", () => {
  const decor = creerPhare();
  const objets = (decor.children[0]!.userData.objets ?? {}) as Record<string, THREE.Object3D>;
  const vu = (etat: Partial<Parameters<typeof animerPhare>[5]["etat"] & object>, epave = false) => ({
    etat: { escabeau: "hangar" as const, bidon: "cuve" as const, prisme: "tombe" as const, lanterne: false, compresseur: false, corneSonnee: false, ...etat },
    epave,
  });
  animerPhare(decor, 30, 4, 0.016, Math.PI / 4, vu({}), []);
  assert.ok(objets.lanterne_eteinte!.visible && !objets.lanterne_allumee!.visible);
  assert.ok(objets.prisme_tombe!.visible && !objets.prisme_manquant!.visible);
  assert.ok(objets.bidon_petrole!.visible && objets.escabeau_phare!.visible && objets.courroie_compresseur!.visible);
  assert.ok(!objets.epave_apres!.visible, "la crique vide");
  animerPhare(decor, 30, 4, 0.016, Math.PI / 4, vu({ escabeau: "bras", bidon: "plein", prisme: "main" }), []);
  assert.ok(!objets.escabeau_phare!.visible && !objets.bidon_petrole!.visible && !objets.prisme_tombe!.visible);
  animerPhare(decor, 30, 4, 0.016, Math.PI / 4, vu({ escabeau: "marque", bidon: "verse", prisme: "remis", lanterne: true, compresseur: true }, true), [{ donnees: { type: "phare_cloche", disponible: false } }]);
  assert.ok(objets.escabeau_phare!.visible);
  // L'escabeau est déplacé du hangar à la marque, sous l'escalier.
  const p = new THREE.Vector3();
  objets.escabeau_phare!.getWorldPosition(p);
  assert.ok(p.length() > 5, "déplacé");
  assert.ok(objets.lanterne_allumee!.visible && !objets.lanterne_eteinte!.visible && objets.prisme_manquant!.visible);
  assert.ok(!objets.courroie_compresseur!.visible);
  assert.ok(objets.epave_apres!.visible, "l'épave échouée");
  assert.ok(!objets.cloche_cargo!.visible, "la cloche prise");
});

test("le client propose les gestes du phare : prendre l'escabeau au hangar ; les bras chargés, le poser ; sous l'escalier, monter", () => {
  const client = new PhareClient(() => {}, () => ({}) as HTMLElement);
  const rien = { A: null, B: null, cible: null };
  const etat = { escabeau: "hangar" as const, bidon: "cuve" as const, prisme: "tombe" as const, lanterne: false, compresseur: false, corneSonnee: false };
  client.recevoir({ t: "phare", etat });
  const libelle = (p: { A: { libelle: string } | null }) => p.A?.libelle ?? "";
  assert.match(libelle(client.proposer(ENDROITS_PHARE.hangar, rien)), /Prendre l'escabeau/);
  client.recevoir({ t: "phare", etat: { ...etat, escabeau: "bras" } });
  assert.ok(client.dansLesBras);
  assert.equal(libelle(client.proposer(ENDROITS_PHARE.marque, rien)), "Poser l'escabeau sous l'escalier");
  client.recevoir({ t: "phare", etat: { ...etat, escabeau: "marque", bidon: "plein" } });
  assert.equal(libelle(client.proposer(ENDROITS_PHARE.marque, rien)), "Monter verser le pétrole");
  client.recevoir({ t: "phare", etat: { ...etat, escabeau: "marque", bidon: "verse", prisme: "remis" } });
  assert.equal(libelle(client.proposer(ENDROITS_PHARE.marque, rien)), "Monter allumer la lanterne");
  assert.match(libelle(client.proposer(ENDROITS_PHARE.sautDe, rien)), /Sauter/);
  client.recevoir({ t: "phare", etat });
  assert.match(libelle(client.proposer(ENDROITS_PHARE.cuve, rien)), /Remplir le bidon/);
});

// ---------- Correctifs après l'essai sur l'iPhone (2026-10-14) ----------

test("la coque de l'épave ne s'efface pas devant qui longe le haut de la falaise ; de la grève, derrière elle, si", () => {
  const decor = creerPhare();
  const coque = (decor.userData.toits as { nom?: string; efface?: boolean }[]).find((t) => t.nom?.startsWith("coque de l'épave"))!;
  assert.ok(coque, "la couche de la coque");
  const vu = { etat: { escabeau: "marque" as const, bidon: "verse" as const, prisme: "remis" as const, lanterne: true, compresseur: true, corneSonnee: false }, epave: true };
  // Le long du bord de la falaise, neuf mètres au-dessus de l'épave, dans les quatre quarts de tour de la caméra.
  for (let quart = 0; quart < 4; quart++) {
    const lacet = Math.PI / 4 + (quart * Math.PI) / 2;
    for (let x = -14; x <= 2; x += 1) {
      const p = jeu(x, 11);
      assert.ok(Math.abs(solPhare(p.x, p.z, true)) < 0.05, "sur le plateau");
      animerPhare(decor, p.x, p.z, 0.016, lacet, vu, []);
      assert.ok(!coque.efface, `la coque reste, vue de x ${x} (quart ${quart})`);
    }
  }
  // Sur la grève, au nord-ouest de l'épave, la caméra au sud-est : la coque cache le personnage, elle s'efface.
  const greve = jeu(-13, 16);
  assert.ok(solPhare(greve.x, greve.z, true) < -8, "sur la grève");
  animerPhare(decor, greve.x, greve.z, 0.016, Math.PI / 4, vu, []);
  assert.ok(coque.efface, "derrière la coque, elle s'efface");
});

test("les Noyés de la grève ne mettent pas en garde au bord du tronçon effondré : le geste « Sauter » reste proposé", () => {
  const client = new PhareClient(() => {}, () => ({}) as HTMLElement);
  const noye = jeu(-19.8, 22.1);
  const dormeur = jeu(-20.5, 2.6);
  // En haut (le bord du trou, le haut de la falaise), les Noyés d'en bas ne menacent pas ; un dormeur du chemin, si.
  assert.ok(!client.menace(noye, ENDROITS_PHARE.sautDe));
  assert.ok(!client.menace(noye, jeu(-12, 11)));
  assert.ok(client.menace(dormeur, ENDROITS_PHARE.sautDe));
  // Sauté sur la partie basse, on est à leur étage : ils menacent, le dormeur d'en haut plus.
  assert.ok(client.menace(noye, ENDROITS_PHARE.sautVers));
  assert.ok(!client.menace(dormeur, ENDROITS_PHARE.sautVers));
  // Sans l'épave, là où elle s'échouera, c'est l'eau de la crique : en bas. L'épave là, son pont est un étage à part (0.10,
  // essai sur l'iPhone du 2026-10-15 : rendu/phare-greve.test.ts).
  assert.ok(client.menace(noye, jeu(-5, 20), false));
  assert.ok(!client.menace(noye, jeu(-5, 20), true));
});

test("K4 : à l'échouage, la vue du jeu ne tremble plus (la secousse est dans le plan de la scène) ; l'épave attend le retour au personnage", async () => {
  const vraiMaintenant = performance.now.bind(performance);
  let t = 1000;
  Object.defineProperty(performance, "now", { value: () => t, configurable: true, writable: true });
  try {
    const client = new PhareClient(() => {}, () => ({}) as HTMLElement);
    const scene = { hauteurSuivie: 0, decalageCamera: { x: 0, y: 0, z: 0 } };
    client.recevoir({ t: "phare", etat: { escabeau: "marque", bidon: "verse", prisme: "remis", lanterne: true, compresseur: false, corneSonnee: false }, cargo: true });
    for (let i = 0; i < 30; i++) {
      t += 16;
      client.animer();
      client.poser(true, { epave: true }, 0.016, { personnage: null, eteints: [], cercles: [], scene });
    }
    assert.deepEqual(scene.decalageCamera, { x: 0, y: 0, z: 0 });
    assert.equal(client.scene({ epave: true }).epave, false, "pas encore l'épave");
    t += 6000;
    assert.equal(client.scene({ epave: true }).epave, true);
  } finally {
    Object.defineProperty(performance, "now", { value: vraiMaintenant, configurable: true, writable: true });
  }
});

test("le cargo qui approche, la nuit, braque son projecteur sur la crique (une lumière de plus, seulement alors)", async () => {
  const { lumieresPhare } = await import("./phare.ts");
  const etat = { escabeau: "marque" as const, bidon: "verse" as const, prisme: "remis" as const, lanterne: true, compresseur: true, corneSonnee: false };
  const sans = lumieresPhare({ etat, epave: false }, true).length;
  assert.equal(lumieresPhare({ etat, epave: false, feux: { x: 20, z: 70, cap: Math.PI } }, true).length, sans + 1);
  assert.equal(lumieresPhare({ etat, epave: false, feux: { x: 20, z: 70, cap: Math.PI } }, false).length, 0, "le jour, rien");
});

test("la clôture : le muret de pierres sèches du modèle (P-1) borde le lot au nord, à l'ouest et à l'est, juste au-delà de la limite, ouvert sur la route au nord", async () => {
  const { SORTIES_PHARE, zonePhare, jeu: auJeu } = await import("../../../commun/src/phare.ts");
  const { SEGMENTS_MODELE } = await import("../../../commun/src/phare-modele.ts");
  const zone = zonePhare({ epave: false });
  const muret = SEGMENTS_MODELE.filter((s) => s.nature.startsWith("muret de pierres sèches")).map((s) => ({ a: auJeu(s.x1, s.z1), b: auJeu(s.x2, s.z2) }));
  assert.ok(muret.length >= 4, "le muret");
  // Sur la limite (à moins d'un demi-mètre), côté lande : il ne mange rien de ce qu'on foule.
  for (const { a, b } of muret) {
    for (const p of [a, b]) assert.ok(p.x <= zone.xMin || p.x >= zone.xMax || p.z <= zone.zMin, `une pierre dans le lieu (${p.x.toFixed(2)}, ${p.z.toFixed(2)})`);
    if (a.x === b.x) assert.ok(Math.abs(a.x - zone.xMin) < 0.5 || Math.abs(a.x - zone.xMax) < 0.5);
    else assert.ok(Math.abs(a.z - zone.zMin) < 0.5);
  }
  // Les trois bords : l'ouest, le nord, l'est.
  assert.ok(muret.some(({ a, b }) => a.x === b.x && a.x < zone.xMin) && muret.some(({ a, b }) => a.x === b.x && a.x > zone.xMax));
  // La route d'arrivée reste ouverte : aucun tronçon du nord ne traverse la sortie.
  const s = SORTIES_PHARE[0]!;
  for (const { a, b } of muret) if (a.z === b.z) assert.ok(Math.max(a.x, b.x) <= s.boite.x - s.boite.l / 2 + 0.01 || Math.min(a.x, b.x) >= s.boite.x + s.boite.l / 2 - 0.01, `le muret coupe la route (${a.x} → ${b.x})`);
});

test("au pied de l'escalier, la fouille de la réserve (posée sur la marque) ne cache pas « Monter allumer la lanterne »", () => {
  const client = new PhareClient(() => {}, () => ({}) as HTMLElement);
  const m = ENDROITS_PHARE.marque;
  // La fouille de la réserve du gardien, pas encore faite, juste sous les pieds.
  const fouille = { A: { libelle: "Fouiller la réserve du gardien", message: { t: "interagir", cible: { genre: "ressource", id: 13 }, verbe: "fouiller" } }, B: null, cible: { x: m.x + 0.05, z: m.z + 0.05, rayon: 0.5 } } as unknown as Parameters<typeof client.proposer>[1];
  const etat = { escabeau: "marque" as const, bidon: "verse" as const, prisme: "remis" as const, lanterne: false, compresseur: false, corneSonnee: false };
  client.recevoir({ t: "phare", etat });
  assert.equal(client.proposer(m, fouille).A?.libelle, "Monter allumer la lanterne");
  client.recevoir({ t: "phare", etat: { ...etat, bidon: "plein" } });
  assert.equal(client.proposer(m, fouille).A?.libelle, "Monter verser le pétrole");
  // Le scénario fait (la lanterne allumée), la fouille reprend sa place.
  client.recevoir({ t: "phare", etat: { ...etat, lanterne: true } });
  assert.equal(client.proposer(m, fouille).A?.libelle, "Fouiller la réserve du gardien");
});
