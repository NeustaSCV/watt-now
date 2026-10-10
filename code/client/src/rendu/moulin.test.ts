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

test("la grande porte ouverte : les battants fermés s'effacent, les battants ouverts paraissent ; la clé prise s'efface", () => {
  const decor = creerMoulin();
  /** Une empreinte des sommets du modèle (sommes pondérées) : elle change dès qu'un triangle est aplati. */
  const positions = () => {
    let somme = 0;
    let k = 0;
    decor.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || m.name === "grande-porte") return;
      for (const v of m.geometry.getAttribute("position").array as Float32Array) somme += v * ((k++ % 7) + 1);
    });
    return Math.round(somme * 1000) / 1000;
  };
  const avant = positions();
  const ressources = [{ donnees: { type: "moulin_cle" as const, disponible: true } }];
  animerMoulin(decor, 10, 10, 0.016, Math.PI / 4, { grande_porte: true }, ressources, []);
  const ouverte = positions();
  assert.notEqual(ouverte, avant, "des triangles ont été aplatis");
  assert.ok(decor.getObjectByName("grande-porte")!.visible);
  ressources[0]!.donnees.disponible = false;
  animerMoulin(decor, 10, 10, 0.016, Math.PI / 4, { grande_porte: false }, ressources, []);
  ressources[0]!.donnees.disponible = true;
  animerMoulin(decor, 10, 10, 0.016, Math.PI / 4, { grande_porte: false }, ressources, []);
  assert.equal(positions(), avant, "tout revient tel quel");
  assert.ok(!decor.getObjectByName("grande-porte")!.visible);
  // Un Éteint au fond de la fosse est dessiné au fond.
  const eteint = { objet: new THREE.Object3D() };
  const f = jeu(6.4, -3);
  eteint.objet.position.set(f.x, 0, f.z);
  animerMoulin(decor, 10, 10, 0.016, Math.PI / 4, { grande_porte: false }, [], [eteint]);
  assert.ok(eteint.objet.position.y < -0.5);
});
