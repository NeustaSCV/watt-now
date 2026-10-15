// 0.10, R52 (« un lieu ne s'arrête jamais net », essai sur l'iPhone du 2026-10-15) : les bouts de la grève du phare. La
// sortie de l'ouest (le sentier côtier) reste atteignable depuis le bas de la rampe ; à l'est, l'éboulis arrête sur les
// galets comme dans l'eau, et ne coupe pas le pont de l'épave ; à l'ouest, au sud du sentier, les rochers ferment la
// grève ; le décor dessine les rochers sur ces lignes, le sentier, la côte qui continue, la mer claire ou profonde.

import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";

// Une toile de dessin factice (comme rendu/phare.test.ts).
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
const { heurte, dansBoite, sortiePourPartir } = await import("../../../commun/src/lieux.ts");
const { EBOULIS_EST, ROCHERS_OUEST, SORTIES_PHARE, auModele, dansLaCoque, etageDuPhare, jeu, zonePhare } = await import("../../../commun/src/phare.ts");
const { creerPhare } = await import("./phare.ts");
const { zLarge } = await import("./phare-bords.ts");

/** Le x (repère du modèle) de la ligne de l'éboulis à ce z. */
const xEboulis = (z: number) => EBOULIS_EST.x1 + ((EBOULIS_EST.x2 - EBOULIS_EST.x1) * (z - EBOULIS_EST.z1)) / (EBOULIS_EST.z2 - EBOULIS_EST.z1);

/** Marcher tout droit (dx, dz) pendant `secondes`, à pas de 50 ms ; rend la position, dans le repère du modèle. */
function marcher(depart: { x: number; z: number }, dx: number, dz: number, secondes: number, epave: boolean) {
  const zone = zonePhare({ epave });
  let p = { ...jeu(depart.x, depart.z), o: 0 };
  for (let t = 0; t < secondes; t += 0.05) p = avancer(p, { dx, dz, allure: "marche" }, 0.05, zone);
  return auModele(p.x, p.z);
}

test("la sortie de l'ouest (le sentier côtier) reste atteignable à pied depuis le bas de la rampe, épave ou non", () => {
  const sortie = SORTIES_PHARE[1]!;
  for (const epave of [false, true]) {
    const zone = zonePhare({ epave });
    // Les cases de 25 cm où l'on tient debout, de proche en proche depuis le bas de la rampe, sur les galets.
    const pas = 0.25;
    const depart = jeu(-24, 22.5);
    const vues = new Set<string>();
    const file: [number, number][] = [[Math.round(depart.x / pas), Math.round(depart.z / pas)]];
    let atteinte = false;
    while (file.length && !atteinte) {
      const [i, k] = file.pop()!;
      const cle = `${i},${k}`;
      if (vues.has(cle)) continue;
      vues.add(cle);
      const x = i * pas, z = k * pas;
      if (x < zone.xMin || x > zone.xMax || z < zone.zMin || z > zone.zMax || heurte(zone, x, z, 0.35) || etageDuPhare(x, z, epave) === "haut") continue;
      if (dansBoite(x, z, sortie.boite) && sortiePourPartir("phare", x, z)?.libelle === sortie.libelle) atteinte = true;
      file.push([i + 1, k], [i - 1, k], [i, k + 1], [i, k - 1]);
    }
    assert.ok(atteinte, `épave : ${epave}`);
  }
  // Et en marchant : du bas de la rampe vers l'ouest, au pied de la falaise.
  const p = marcher({ x: -24.5, z: 21.5 }, -1, -0.9, 3, true);
  const q = marcher(p, -1, 0, 3, true);
  const j = jeu(q.x, q.z);
  assert.ok(dansBoite(j.x, j.z, sortie.boite), `arrivé en ${q.x.toFixed(2)}, ${q.z.toFixed(2)}`);
});

test("à l'est, l'éboulis arrête sur les galets et dans l'eau, là où l'on butait (ou un peu avant) ; il ne coupe pas le pont de l'épave", () => {
  // Sur les galets, sans l'épave : on marche vers l'est, on s'arrête contre l'éboulis.
  for (const z of [17, 19.5]) {
    const p = marcher({ x: -12, z }, 1, 0, 8, false);
    assert.ok(Math.abs(p.z - z) < 0.3, "tout droit");
    assert.ok(p.x < xEboulis(z) && p.x > xEboulis(z) - 0.9, `arrêté en x ${p.x.toFixed(2)} (l'éboulis à ${xEboulis(z).toFixed(2)})`);
  }
  // Dans l'eau peu profonde : de même.
  const z = 24;
  assert.ok(z < zLarge(-6), "dans la bande d'eau praticable");
  const p = marcher({ x: -12, z }, 1, 0, 14, false);
  assert.ok(p.x < xEboulis(z) && p.x > xEboulis(z) - 0.9, `dans l'eau, arrêté en x ${p.x.toFixed(2)}`);
  // Avec l'épave : le pont reste entier là où passe la ligne de l'éboulis. Les boîtes de l'éboulis (celles de la crique
  // vide, sur sa ligne) qui restent avec l'épave sont toutes hors de la coque ; le milieu du pont, sur la ligne, est libre.
  const cle = (b: { x: number; z: number }) => `${b.x.toFixed(3)},${b.z.toFixed(3)}`;
  const surLaLigne = (b: { x: number; z: number }) => {
    const m = auModele(b.x, b.z);
    return Math.abs(m.x - xEboulis(m.z)) < 0.02 && m.z >= EBOULIS_EST.z1 && m.z <= EBOULIS_EST.z2;
  };
  const eboulis = new Set(zonePhare({ epave: false }).obstacles.filter(surLaLigne).map(cle));
  assert.ok(eboulis.size > 100, `${eboulis.size} boîtes`);
  const zoneEpave = zonePhare({ epave: true });
  const restent = zoneEpave.obstacles.filter((b) => eboulis.has(cle(b)));
  assert.ok(restent.length > 20 && restent.length < eboulis.size, `${restent.length} restent`);
  for (const b of restent) {
    const m = auModele(b.x, b.z);
    assert.ok(!dansLaCoque(m.x, m.z), `une boîte de l'éboulis sur le pont, en ${m.x.toFixed(2)}, ${m.z.toFixed(2)}`);
  }
});

test("à l'ouest, au sud du sentier, les rochers ferment la grève et l'eau : on bute contre eux, pas contre le bord du lot", () => {
  for (const z of [19.5, 21.5]) {
    const p = marcher({ x: -26, z }, -1, 0, 5, true);
    assert.ok(Math.abs(p.x - ROCHERS_OUEST.x1) < 0.5, `arrêté en x ${p.x.toFixed(2)}`);
    assert.ok(p.x > -29.5 + 0.35 + 0.01, "avant le bord du lot");
  }
});

test("le décor : des rochers sur les deux lignes, le sentier, la côte au-delà du bord ouest du lot, la mer sombre au large", () => {
  const decor = creerPhare();
  decor.updateMatrixWorld(true);
  // Les sommets de tout le décor, dans le repère du modèle.
  const pts: THREE.Vector3[] = [];
  const v = new THREE.Vector3();
  const OX = jeu(0, 0);
  decor.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const p = m.geometry.getAttribute("position");
    for (let i = 0; i < p.count; i += 3) pts.push(v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld).clone().sub(new THREE.Vector3(OX.x, 0, OX.z)));
  });
  const autour = (x: number, z: number, r: number, yMin: number) => pts.some((p) => Math.hypot(p.x - x, p.z - z) < r && p.y > yMin);
  // L'éboulis dépasse de l'eau, sur toute sa ligne ; les rochers de l'ouest aussi.
  for (const t of [0.2, 0.5, 0.8]) {
    const z = EBOULIS_EST.z1 + (EBOULIS_EST.z2 - EBOULIS_EST.z1) * t;
    assert.ok(autour(xEboulis(z) + 1.2, z, 1.5, -8.6), `l'éboulis à z ${z.toFixed(1)}`);
    const zo = ROCHERS_OUEST.z1 + (ROCHERS_OUEST.z2 - ROCHERS_OUEST.z1) * t;
    assert.ok(autour(ROCHERS_OUEST.x1 - 1, zo, 1.5, -8.6), `les rochers de l'ouest à z ${zo.toFixed(1)}`);
  }
  // La côte continue à l'ouest du lot (la falaise, à mi-hauteur), et les marches du sentier y montent.
  assert.ok(autour(-45, 13, 2, -6), "la falaise au-delà du lot");
  assert.ok(autour(-36, 14.5, 1.2, -6) && autour(-40.5, 13, 1.2, -2.5), "les marches");
  // La mer : plus sombre au-delà de la bande où l'on marche.
  let mer: THREE.Mesh | null = null;
  decor.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!mer && m.isMesh && (m.material as THREE.MeshStandardMaterial).transparent && (m.material as THREE.MeshStandardMaterial).metalness === 0.25) mer = m;
  });
  const g = (mer as unknown as THREE.Mesh).geometry;
  const pos = g.getAttribute("position");
  const col = g.getAttribute("color");
  const teinte = (x: number, z: number) => {
    let best = -1, d0 = Infinity;
    for (let i = 0; i < pos.count; i++) {
      const d = Math.hypot(pos.getX(i) - x, pos.getZ(i) - z);
      if (pos.getY(i) > -9.01 && pos.getY(i) < -8.99 && d < d0) {
        d0 = d;
        best = i;
      }
    }
    return col.getX(best);
  };
  assert.ok(teinte(-18, zLarge(-18) - 1) > teinte(-18, zLarge(-18) + 2) + 0.3, "la bande claire, le large sombre");
});
