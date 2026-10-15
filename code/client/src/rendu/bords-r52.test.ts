// 0.10, R52 (« un lieu ne s'arrête jamais net ») : la vue d'ensemble construit tous les tronçons des haltes puis revient ;
// les bords ajoutés (ganivelles, prolongements, dunes) restent hors de ce qu'on foule (aucun obstacle de plus) ; à l'hôtel,
// on marche lentement dans la bande d'eau, on n'y court pas, et l'eau profonde arrête ; chaque panneau de sortie a sa
// lanterne, une source de lumière la nuit ; les sorties restent atteignables.

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

const { RenduRoutePont } = await import("./route-pont.ts");
const { RenduCorniche } = await import("./corniche.ts");
const { RenduGue } = await import("./gue.ts");
const { creerHotel, lumieresHotel } = await import("./hotel.ts");
const { heurte, sortiesDe, entreesDe, zoneDe } = await import("../../../commun/src/lieux.ts");
const { zoneRoutePont, PANNEAUX_SORTIE_PONT } = await import("../../../commun/src/route-pont.ts");
const { zoneCorniche } = await import("../../../commun/src/corniche.ts");
const { BORD_EAU_HOTEL, LARGE_HOTEL, PANNEAU_SORTIE_HOTEL, dansLEauHotel, profondeurEauHotel } = await import("../../../commun/src/hotel.ts");
const { avancer } = await import("../../../commun/src/deplacement.ts");
const { ALLURES } = await import("../../../commun/src/regles.ts");
const { ECRITEAUX } = await import("../../../commun/src/guidage.ts");
const { PANNEAUX_SORTIE_CORNICHE } = await import("./bords-corniche.ts");

type Zone = ReturnType<typeof zoneDe>;
type LieuId = Parameters<typeof zoneDe>[0];

test("la vue d'ensemble construit tous les tronçons (un par image au-delà des voisins), puis on revient aux tronçons du joueur", () => {
  const pont = new RenduRoutePont();
  pont.creer();
  const corniche = new RenduCorniche();
  corniche.creer();
  const gue = new RenduGue(() => {});
  gue.creer();
  const p = { x: 4.5, z: 35 };
  const image = (ensemble: boolean) => {
    pont.animer(p, 0.016, Math.PI / 4, 0, 0, ensemble);
    corniche.animer(p, 0.016, Math.PI / 4, [], ensemble);
    gue.animer(p, 0.016, Math.PI / 4, 0, 0, ensemble);
  };
  image(true);
  assert.equal(pont.construits.length, 3, "les deux proches et un lointain à la première image");
  image(true);
  for (const r of [pont, corniche]) assert.deepEqual([...r.construits].sort(), [...new Set(r.construits)].sort().filter(Boolean), "pas de doublon");
  assert.equal(pont.construits.length, 4, "tout le pont à la deuxième image");
  assert.equal(corniche.construits.length, 4, "toute la corniche");
  assert.equal(gue.construits.length, 4, "tout le gué");
  // Le zoom fini : on revient au fonctionnement du jeu.
  image(false);
  assert.deepEqual([...pont.construits].sort(), ["bourg", "pylone"]);
  assert.deepEqual([...corniche.construits].sort(), ["montee", "tunnel"]);
});

/** Les sommets (repère du jeu) des maillages d'un groupe, hors de ce qu'on veut ignorer. */
function sommets(groupe: THREE.Object3D, garder: (m: THREE.Mesh) => boolean = () => true): THREE.Vector3[] {
  let racine = groupe;
  while (racine.parent) racine = racine.parent;
  racine.updateMatrixWorld(true);
  const res: THREE.Vector3[] = [];
  groupe.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !garder(m)) return;
    const pos = m.geometry.getAttribute("position");
    for (let i = 0; i < pos.count; i += 3) res.push(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld));
  });
  return res;
}

/** Ce point est-il là où l'on marche (dans la zone, hors des obstacles) ? */
const foule = (zone: Zone, x: number, z: number) => x > zone.xMin && x < zone.xMax && z > zone.zMin && z < zone.zMax && !heurte(zone, x, z, 0.05);

test("les ganivelles, les prolongements et les dunes ajoutés ne sont pas là où l'on marche (aucun obstacle de plus)", () => {
  // La route du pont : ganivelles, piquets, oyats (les dunes posées sur la limite y débordent d'un mètre, à ras du sol).
  const pont = new RenduRoutePont();
  const decorPont = pont.creer();
  const zp = zoneRoutePont({ haute: false, ouverte: true });
  const loinDesPanneaux = (v: THREE.Vector3) => PANNEAUX_SORTIE_PONT.every((p) => Math.hypot(v.x - p.x, v.z - p.z) > 2.5);
  const bords = decorPont.getObjectByName("bords du pont")!;
  assert.ok(bords, "les bords du pont");
  const dedans = sommets(bords, (m) => !(m.material as THREE.MeshStandardMaterial).map).filter((v) => v.y > 0.05 && loinDesPanneaux(v) && foule(zp, v.x, v.z));
  assert.equal(dedans.length, 0, `${dedans.length} sommets là où l'on marche, ex. ${JSON.stringify(dedans[0])}`);
  // La ganivelle est bien posée sur les deux limites (de part et d'autre de la route) : des lattes à moins de 30 cm.
  const lattes = sommets(bords).filter((v) => v.y > 0.6 && v.y < 1.2);
  for (const x of [zp.xMin, zp.xMax]) for (const z of [15, 55]) assert.ok(lattes.some((v) => Math.abs(v.x - x) < 0.4 && Math.abs(v.z - z) < 1), `une latte en (${x}, ${z})`);
  // La corniche : tout le prolongement est au-delà des deux bouts du lot (sauf le mât de la lanterne, au panneau).
  const corniche = new RenduCorniche();
  const decorCo = corniche.creer();
  for (const cote of ["ouest", "est"]) {
    const g = decorCo.getObjectByName(`bords de la corniche (${cote})`)!;
    assert.ok(g, cote);
    const hors = sommets(g).filter((v) => v.x > 0.5 && v.x < 199.5);
    assert.equal(hors.length, 0, `${cote} : ${hors.length} sommets dans le lot`);
  }
  // L'hôtel : la promenade prolongée, les ganivelles, les dunes sont hors de la zone (l'eau peu profonde, elle, y est).
  const hotel = creerHotel();
  const b = hotel.getObjectByName("bords de l'hôtel")!;
  const zh = zoneDe("grand_hotel");
  const horsZone = sommets(b, (m) => m.name !== "eau peu profonde" && !m.name.startsWith("lanterne")).filter((v) => v.y > 0.05 && foule(zh, v.x, v.z) && Math.hypot(v.x - PANNEAU_SORTIE_HOTEL.x, v.z - PANNEAU_SORTIE_HOTEL.z) > 2);
  assert.equal(horsZone.length, 0, `${horsZone.length} sommets là où l'on marche, ex. ${JSON.stringify(horsZone[0])}`);
});

test("à l'hôtel, la bande d'eau peu profonde : on y marche ralenti, on n'y court pas, on s'y enfonce ; l'eau profonde arrête", () => {
  const zone = zoneDe("grand_hotel");
  const x = 40;
  assert.ok(!dansLEauHotel(x, BORD_EAU_HOTEL - 0.5), "sur le sable, pas d'eau");
  assert.ok(dansLEauHotel(x, BORD_EAU_HOTEL + 1), "dans la bande");
  assert.ok((zone.frein?.(x, BORD_EAU_HOTEL + 1) ?? 1) < 1 && (zone.frein?.(x, BORD_EAU_HOTEL - 2) ?? 1) === 1);
  assert.ok(profondeurEauHotel(x, BORD_EAU_HOTEL + 2) > 0.3 && profondeurEauHotel(x, BORD_EAU_HOTEL - 1) === 0, "jusqu'aux genoux");
  // On court vers le large : sur le sable on court, dans l'eau on marche (et moins vite), et l'on s'arrête avant le large.
  let p = { x, z: BORD_EAU_HOTEL - 3, o: 0 };
  const dt = 0.05;
  let vitesseSable = 0;
  let vitesseEau = 0;
  for (let i = 0; i < 400; i++) {
    const q = avancer(p, { dx: 0, dz: 1, allure: "course" }, dt, zone);
    const v = (q.z - p.z) / dt;
    if (p.z < BORD_EAU_HOTEL - 1) vitesseSable = v;
    else if (dansLEauHotel(p.x, p.z) && v > 0) vitesseEau = v;
    p = q;
  }
  assert.ok(Math.abs(vitesseSable - ALLURES.course) < 1e-6, `on court sur le sable (${vitesseSable})`);
  assert.ok(vitesseEau > 0 && vitesseEau <= ALLURES.marche * 0.61, `dans l'eau, on marche ralenti (${vitesseEau})`);
  assert.ok(p.z < LARGE_HOTEL && p.z > LARGE_HOTEL - 1, `l'eau profonde arrête (${p.z.toFixed(2)})`);
});

test("chaque panneau de sortie a « Lire » (sa vraie destination) et une lanterne, une source de lumière la nuit seulement", () => {
  const pres = (lieu: LieuId, p: { x: number; z: number }) => ECRITEAUX.find((e) => e.lieu === lieu && e.points.some((q) => Math.hypot(q.x - p.x, q.z - p.z) < 1));
  const ouest = (lieu: LieuId, p: { x: number; z: number }) => pres(lieu, p)?.texte ?? "";
  assert.match(ouest("route_pont", PANNEAUX_SORTIE_PONT[0]), /Ton terrain/);
  assert.match(ouest("route_pont", PANNEAUX_SORTIE_PONT[1]), /Grand Hôtel des Flots · 2 km →/);
  assert.match(ouest("corniche", PANNEAUX_SORTIE_CORNICHE[0]!), /Ton terrain · 3 km/);
  assert.match(ouest("corniche", PANNEAUX_SORTIE_CORNICHE[1]!), /Phare du cap · 2 km →/);
  assert.match(ouest("grand_hotel", PANNEAU_SORTIE_HOTEL), /Route du pont.*Ton terrain/);
  for (const e of ECRITEAUX) assert.doesNotMatch(e.texte, /Port de pêche/, e.id);
  // Les lanternes : une source à moins de 1,5 m au-dessus de chaque panneau, la nuit ; aucune le jour.
  const pont = new RenduRoutePont();
  pont.creer();
  const corniche = new RenduCorniche();
  corniche.creer();
  const hotel = creerHotel();
  const pres2 = (sources: { x: number; y: number; z: number }[], p: { x: number; z: number }) => sources.some((s) => Math.hypot(s.x - p.x, s.z - p.z) < 1.6 && s.y > 2);
  for (const p of PANNEAUX_SORTIE_PONT) assert.ok(pres2(pont.lumieres(true, p), p), `la lanterne du pont en ${p.x}`);
  for (const p of PANNEAUX_SORTIE_CORNICHE) assert.ok(pres2(corniche.lumieres(true), p), `la lanterne de la corniche en ${p.x}`);
  assert.ok(pres2(lumieresHotel(hotel, true, null, { x: 60, z: 48 }), PANNEAU_SORTIE_HOTEL), "la lanterne de l'hôtel");
  assert.equal(pont.lumieres(false, PANNEAUX_SORTIE_PONT[0]).length, 0);
  assert.equal(corniche.lumieres(false).length, 0);
  assert.ok(!pres2(lumieresHotel(hotel, false, null, { x: 60, z: 48 }), PANNEAU_SORTIE_HOTEL));
});

test("les sorties restent atteignables à pied depuis l'arrivée (route du pont, corniche, hôtel)", () => {
  const zones: [LieuId, Zone][] = [
    ["route_pont", zoneRoutePont({ haute: false, ouverte: true })],
    ["corniche", zoneCorniche(true)],
    ["grand_hotel", zoneDe("grand_hotel")],
  ];
  for (const [lieu, zone] of zones) {
    const pas = 0.5;
    const cle = (i: number, j: number) => `${i},${j}`;
    for (const entree of entreesDe(lieu)) {
      const depart = [Math.round(entree.arrivee.x / pas), Math.round(entree.arrivee.z / pas)] as const;
      const vus = new Set([cle(...depart)]);
      const file = [depart as readonly [number, number]];
      while (file.length) {
        const [i, j] = file.shift()!;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const n = [i + di!, j + dj!] as const;
          if (vus.has(cle(...n))) continue;
          const x = n[0] * pas;
          const z = n[1] * pas;
          if (x <= zone.xMin || x >= zone.xMax || z <= zone.zMin || z >= zone.zMax || heurte(zone, x, z, 0.3)) continue;
          vus.add(cle(...n));
          file.push(n);
        }
      }
      for (const s of sortiesDe(lieu)) {
        let ok = false;
        for (let x = s.boite.x - s.boite.l / 2; x <= s.boite.x + s.boite.l / 2 && !ok; x += pas) for (let z = s.boite.z - s.boite.p / 2; z <= s.boite.z + s.boite.p / 2 && !ok; z += pas) ok = vus.has(cle(Math.round(x / pas), Math.round(z / pas)));
        assert.ok(ok, `${lieu} : de l'arrivée (${entree.arrivee.x}, ${entree.arrivee.z}) à la sortie vers ${s.vers}`);
      }
      if (lieu === "grand_hotel") assert.ok(vus.has(cle(Math.round(40 / pas), Math.round((BORD_EAU_HOTEL + 1.5) / pas))), "la bande d'eau se rejoint");
    }
  }
});
