// 0.10, R52 (« un lieu ne s'arrête jamais net », essai sur l'iPhone du 2026-10-15) : les bouts de la grève du phare, tels
// que le modèle les dessine depuis ses retouches de la 0.10 (P-1 à P-4, R0-3). La sortie de l'ouest (le sentier côtier)
// reste atteignable depuis le bas de la rampe ; à l'est, l'éboulis arrête sur les galets comme dans l'eau, et ne coupe pas
// le pont de l'épave ; à l'ouest, au sud du sentier, les rochers ferment la grève ; le décor du modèle dessine les rochers
// sur ces lignes, la côte qui continue (ses alentours), et une seule mer, claire où l'on marche, sombre au large.

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
const { LARGEUR_EAU, SORTIES_PHARE, auModele, dansLEauPhare, dansLaCoque, etageDuPhare, jeu, zonePhare } = await import("../../../commun/src/phare.ts");
const { SEGMENTS_MODELE } = await import("../../../commun/src/phare-modele.ts");
const { creerPhare } = await import("./phare.ts");

/** Une ligne d'obstacles du modèle (ses segments mis bout à bout, du premier point au dernier). */
function ligne(debut: string): { x1: number; z1: number; x2: number; z2: number } {
  const s = SEGMENTS_MODELE.filter((q) => q.nature.startsWith(debut));
  assert.ok(s.length > 3, debut);
  return { x1: s[0]!.x1, z1: s[0]!.z1, x2: s.at(-1)!.x2, z2: s.at(-1)!.z2 };
}
/** L'éboulis de l'est et les rochers de l'ouest (P-3), obstacles du modèle. */
const EBOULIS_EST = ligne("rochers : éboulis");
const ROCHERS_OUEST = ligne("rochers au sud du sentier");

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
  assert.ok(dansLEauPhare(jeu(-6, z).x, jeu(-6, z).z, false), "dans la bande d'eau praticable");
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

test("le décor du modèle : des rochers sur les deux lignes, la côte au-delà des bords du lot, une seule mer, claire où l'on marche, sombre au large", () => {
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
  // La côte continue hors du lot (les alentours du modèle : la falaise, à l'ouest comme à l'est), la lande au nord.
  assert.ok(autour(-45, 13, 3, -6), "la falaise au-delà du lot, à l'ouest");
  assert.ok(autour(45, 13, 3, -6), "la falaise au-delà du lot, à l'est");
  assert.ok(autour(0, -45, 3, -1), "la lande au nord");
  // La mer : une seule (le jeu ne pose plus la sienne : deux eaux se superposaient), plus claire sur la bande où l'on
  // marche qu'au-delà de la ligne du large.
  const mers: THREE.Mesh[] = [];
  decor.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh && (m.material as THREE.MeshStandardMaterial).transparent && (m.material as THREE.MeshStandardMaterial).metalness === 0.25) mers.push(m);
  });
  assert.equal(mers.length, 1, "une seule mer");
  const g = mers[0]!.geometry;
  const pos = g.getAttribute("position");
  const col = g.getAttribute("color");
  assert.ok(col, "l'eau est coloriée par sommet");
  const teinte = (x: number, z: number) => {
    let best = -1, d0 = Infinity;
    for (let i = 0; i < pos.count; i++) {
      const d = Math.hypot(pos.getX(i) - x, pos.getZ(i) - z);
      if (pos.getY(i) > -9.3 && pos.getY(i) < -8.7 && d < d0) {
        d0 = d;
        best = i;
      }
    }
    return col.getX(best) + col.getY(best) + col.getZ(best);
  };
  // Le bord de l'eau du modèle à x − 18 est en z 22,8 ; le jeu y marche sur LARGEUR_EAU mètres.
  assert.ok(teinte(-18, 22.8 + LARGEUR_EAU / 2) > teinte(-18, 22.8 + LARGEUR_EAU + 6) + 0.1, "la bande claire, le large sombre");
});
