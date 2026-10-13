// Plan 0.8, chantier 12 : le Moulin du Gué à l'écran. Les données du jeu (commun/src/moulin.ts) suivent le modèle de
// la session « bâtiments » (batiments/moulin/modele.js) : ses obstacles, sa fiche (arrivée, sorties, Éteints) ; le
// décor se construit sans navigateur (une toile de dessin factice), tient le budget de l'iPhone, et sait effacer la
// grande porte et ce qu'on emporte.

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
Object.assign(globalThis, { document: { createElement: () => ({ width: 1, height: 1, style: {}, getContext: () => contexte2d }) } });

// @ts-ignore — le modèle est en JavaScript (session « bâtiments »), sans déclaration de types.
const modele = (await import("../batiments/moulin/modele.js")) as {
  FICHE: { lot: { l: number; p: number }; arrivee: { x: number; z: number }; sorties: { x: number; z: number }[]; eteints: { id: string; x: number; z: number; dormant?: true }[] };
  creer(o: { usure: number }): THREE.Group;
};
const { SEGMENTS_MODELE, jeu } = await import("../../../commun/src/moulin.ts");
const { eteintsMoulin } = await import("../../../commun/src/eteints-moulin.ts");
const { MOULIN, SORTIES_MOULIN, arriveeDans, dansBoite } = await import("../../../commun/src/lieux.ts");
const { creerMoulin, animerMoulin } = await import("./moulin.ts");

test("les obstacles relevés dans commun/src/moulin.ts sont ceux du modèle importé (sinon : les recopier)", () => {
  const obstacles = modele.creer({ usure: 0.7 }).userData.obstacles as { x1: number; z1: number; x2: number; z2: number; nature: string }[];
  assert.deepEqual(
    SEGMENTS_MODELE.map(([x1, z1, x2, z2, nature]) => ({ x1, z1, x2, z2, nature })),
    obstacles,
  );
});

test("la fiche du modèle : le lot, l'arrivée au pont, les deux sorties, les 22 Éteints dont 9 dormants", () => {
  const f = modele.FICHE;
  assert.deepEqual([f.lot.l, f.lot.p], [MOULIN.largeur, MOULIN.profondeur]);
  const pont = arriveeDans("moulin", "gue");
  assert.deepEqual({ x: pont.x, z: pont.z }, jeu(f.arrivee.x, f.arrivee.z));
  const halage = SORTIES_MOULIN.find((s) => s.sansArrivee)!;
  const finLevee = f.sorties.find((s) => s.z < -20)!;
  assert.ok(Math.abs(halage.boite.x - jeu(finLevee.x, 0).x) < 0.01, "le halage, au bout de la levée");
  assert.equal(f.eteints.length, 22);
  const nos = eteintsMoulin();
  for (const e of f.eteints) {
    const n = Number(e.id.slice(1));
    const nous = nos.find((x) => x.id === n)!;
    assert.deepEqual({ x: nous.x, z: nous.z }, jeu(e.x, e.z), e.id);
    assert.equal(nous.etat === "dormant", e.dormant === true, `${e.id} dormant`);
  }
  assert.ok(dansBoite(pont.x, pont.z, { x: MOULIN.largeur / 2, z: MOULIN.profondeur / 2, l: MOULIN.largeur, p: MOULIN.profondeur }));
});

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

test("budget iPhone : le décor du Moulin tient sous 60 000 triangles et 40 appels de dessin", () => {
  const { triangles, appels } = compter(creerMoulin());
  assert.ok(triangles <= 60_000, `${triangles} triangles`);
  assert.ok(appels <= 40, `${appels} appels`);
});

test("la grande porte ouverte : la porte fermée du modèle se cache, la porte ouverte paraît ; la clé, la fourche, l'étau pris se cachent", () => {
  // Comme en jeu : le Moulin posé dans le groupe du lieu (main.ts, montrerDecor), et c'est ce groupe qu'on anime.
  const decor = new THREE.Group().add(creerMoulin());
  const objet = (nom: string) => decor.getObjectByName(nom)!;
  const [fermee, ouverte, cle, fourche, etau] = ["grande porte fermée", "grande porte ouverte", "grosse clé", "fourche", "étau"].map(objet);
  for (const o of [fermee, ouverte, cle, fourche, etau]) assert.ok(o, "un objet nommé du modèle");
  // Au départ, la porte est fermée, tout est au clou, contre le mur, sur l'établi.
  assert.ok(fermee!.visible && !ouverte!.visible && cle!.visible && fourche!.visible && etau!.visible);
  const ressources = (["moulin_cle", "moulin_fourche", "moulin_etau"] as const).map((type) => ({ donnees: { type, disponible: true } }));
  animerMoulin(decor, 10, 10, 0.016, Math.PI / 4, { grande_porte: true }, ressources, []);
  assert.ok(!fermee!.visible && ouverte!.visible, "la porte ouverte");
  for (const r of ressources) r.donnees.disponible = false;
  animerMoulin(decor, 10, 10, 0.016, Math.PI / 4, { grande_porte: true }, ressources, []);
  assert.ok(!cle!.visible && !fourche!.visible && !etau!.visible, "pris");
  // Au retour à 24 h : tout revient, la porte refermée.
  for (const r of ressources) r.donnees.disponible = true;
  animerMoulin(decor, 10, 10, 0.016, Math.PI / 4, { grande_porte: false }, ressources, []);
  assert.ok(fermee!.visible && !ouverte!.visible && cle!.visible && fourche!.visible && etau!.visible, "tout revient");
  // Un Éteint au fond de la fosse est dessiné au fond.
  const eteint = { objet: new THREE.Object3D() };
  const f = jeu(6.4, -3);
  eteint.objet.position.set(f.x, 0, f.z);
  animerMoulin(decor, 10, 10, 0.016, Math.PI / 4, { grande_porte: false }, [], [eteint]);
  assert.ok(eteint.objet.position.y < -0.5);
});

test("0.8.3 : dans le couloir du rouet, le rouet et la lanterne (la couche « roue ») s'effacent, et reviennent ensuite", () => {
  const decor = creerMoulin();
  const roue = decor.getObjectByName("roue")!;
  const materiaux = new Set<THREE.Material>();
  // Ce qui se dessine (pas le maillage d'ombre seule, qui reste : l'ombre de la roue au sol).
  roue.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.Material | undefined;
    if ((o as THREE.Mesh).isMesh && m && m.colorWrite !== false) materiaux.add(m);
  });
  assert.ok(materiaux.size > 0);
  const couloir = jeu(5.1, -3);
  for (let i = 0; i < 30; i++) animerMoulin(decor, couloir.x, couloir.z, 0.05, Math.PI / 4, {}, [], []);
  for (const m of materiaux) assert.ok(!m.visible || m.opacity < 0.05, "effacé dans le couloir");
  const cour = jeu(0, 12);
  for (let i = 0; i < 30; i++) animerMoulin(decor, cour.x, cour.z, 0.05, Math.PI / 4, {}, [], []);
  for (const m of materiaux) assert.ok(m.visible && m.opacity > 0.95, "revenu");
});

test("0.8.3 : la grande porte ouverte ne s'efface jamais, même tout près ; fermée, elle s'efface avec la façade", () => {
  const decor = creerMoulin();
  const toits = decor.userData.toits as { nom?: string }[];
  assert.ok(!toits.some((t) => t.nom === "grande porte ouverte"), "la porte ouverte n'est pas une couche qui s'efface");
  assert.ok(toits.some((t) => t.nom === "grande porte fermée"), "la porte fermée s'efface avec la façade");
  let ouverte: THREE.Object3D | undefined;
  decor.traverse((o) => (ouverte ??= (o.userData.objets as Record<string, THREE.Object3D> | undefined)?.porteOuverte));
  assert.ok(ouverte, "la porte ouverte du modèle");
  const materiaux = new Set<THREE.Material>();
  ouverte!.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.Material | undefined;
    if ((o as THREE.Mesh).isMesh && m) materiaux.add(m);
  });
  // Tout près de la porte, côté cour, la porte ouverte : ses matières restent pleines.
  const seuil = jeu(1, 2.2);
  for (let i = 0; i < 30; i++) animerMoulin(decor, seuil.x, seuil.z, 0.05, Math.PI / 4, { grande_porte: true }, [], []);
  assert.ok(materiaux.size > 0);
  for (const m of materiaux) assert.ok(m.visible && m.opacity > 0.95, "la porte ouverte reste visible");
});
