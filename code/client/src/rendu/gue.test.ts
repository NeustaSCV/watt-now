// Plan 0.8.2 (chantier F) : le gué à l'écran. La motte de glaise suit le gisement (R2) ; l'aulne qui couvrait l'ancienne
// place s'efface ; « Haler le bac » est proposé partout sur le radeau, dès qu'on y monte (R3) ; l'Éteint qui dérive
// ne met en mode Combat que qui marche sur le radier.

import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";

// Une toile de dessin factice : les textures des enseignes se « dessinent » dans le vide.
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

const { RenduGue, ARBRE_DE_LA_VASE } = await import("./gue.ts");
const { BAC, GLAISE, GLAISE_DU_DESSIN, ID_DERIVE, RADIER, RADEAU_AU_REPOS } = await import("../../../commun/src/gue.ts");
const { estomperToits } = await import("./halte.ts");

/** Les sommets visibles (au-dessus du sol) à moins de `r` m de (x, z), dans tout le décor. */
function sommetsAutour(racine: THREE.Object3D, x: number, z: number, r: number, yMin = 0.05): number {
  racine.updateMatrixWorld(true);
  let n = 0;
  const v = new THREE.Vector3();
  racine.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || (m as unknown as THREE.InstancedMesh).isInstancedMesh) return;
    const pos = m.geometry.getAttribute("position");
    const index = m.geometry.getIndex();
    const k = index ? index.count : pos.count;
    for (let i = 0; i < k; i++) {
      v.fromBufferAttribute(pos, index ? index.getX(i) : i).applyMatrix4(m.matrixWorld);
      if (v.y > yMin && v.y < 1.6 && Math.hypot(v.x - x, v.z - z) < r) n++;
    }
  });
  return n;
}

test("R2 : la motte et la bêche du modèle sont là où le jeu place la glaise ; plus rien à l'ancienne place", () => {
  const gue = new RenduGue(() => {});
  const g = gue.toutConstruire();
  assert.ok(sommetsAutour(g, GLAISE.x, GLAISE.z, 1.2) > 50, "la motte au milieu de la berge");
  assert.equal(sommetsAutour(g, GLAISE_DU_DESSIN.x, GLAISE_DU_DESSIN.z, 0.9, 0.1), 0, "plus de motte sous l'arbre");
});

test("R2 : l'aulne de la vase s'efface quand il cache le joueur, et revient ensuite", () => {
  const gue = new RenduGue(() => {});
  const g = gue.toutConstruire();
  const arbre: THREE.Mesh[] = [];
  g.traverse((o) => o.name === "gue:arbre-vase" && arbre.push(o as THREE.Mesh));
  assert.ok(arbre.length > 0, "l'arbre est une couche à part");
  const opacite = () => Math.min(...arbre.map((m) => (m.material as THREE.Material).opacity));
  // Le joueur au pied de l'arbre (là où il creusait) : l'arbre s'efface.
  for (let i = 0; i < 30; i++) estomperToits(g, ARBRE_DE_LA_VASE.x - 0.5, ARBRE_DE_LA_VASE.z - 2, 0.05);
  assert.ok(opacite() < 0.3, `effacé (${opacite()})`);
  for (let i = 0; i < 30; i++) estomperToits(g, 120, 30, 0.05);
  assert.ok(opacite() > 0.95, "revenu");
});

test("R3 : « Haler le bac » est proposé partout sur le plancher du radeau, dès qu'on y monte, à quai comme au milieu", () => {
  const gue = new RenduGue(() => {});
  const vide = { A: null, B: null, cible: null };
  // Ce qu'on vise autour (une branche, une pierre) ne le cache plus.
  const autour = { A: { libelle: "Ramasser une branche", examiner: "" }, B: null, cible: { x: BAC.cale.x + 1, z: BAC.z, rayon: 0.5 } };
  for (const xr of [BAC.cale.x, BAC.ponton.x, (BAC.cale.x + BAC.ponton.x) / 2]) {
    gue.recevoir({ t: "gue", radeau: { ...RADEAU_AU_REPOS, x: xr } });
    for (let dx = -BAC.demiLongueur - 0.3; dx <= BAC.demiLongueur + 0.3; dx += 0.25) {
      for (let dz = -BAC.demiLargeur + 0.35; dz <= BAC.demiLargeur - 0.35; dz += 0.25) {
        const p = { x: xr + dx, z: BAC.z + dz, o: 0 };
        for (const base of [vide, autour]) assert.equal(gue.proposer(p, base, 0, 0).A?.libelle, "Haler le bac", `(${p.x.toFixed(2)}, ${p.z.toFixed(2)}) radeau en ${xr}`);
      }
    }
  }
});

test("R3 : l'Éteint qui dérive ne met en mode Combat que qui marche sur le radier", () => {
  const gue = new RenduGue(() => {});
  assert.equal(gue.menace(ID_DERIVE, { x: BAC.cale.x, z: BAC.z }), false, "à bord du bac");
  assert.equal(gue.menace(ID_DERIVE, { x: 100, z: (RADIER.z0 + RADIER.z1) / 2 }), true, "sur le radier");
  assert.equal(gue.menace(5, { x: BAC.cale.x, z: BAC.z }), true, "les autres, toujours");
});
