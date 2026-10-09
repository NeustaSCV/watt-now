// La couche de déchets des lieux (0.7, chantier 2) : la disposition, le contenu, les points.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  POINTS_LIEUX,
  cleCouche,
  contenuPointCycle,
  dispositionLieu,
  lireRef,
  piecesCarreau,
  placePoint,
  refConteneur,
  ZONES_DECHETS,
} from "./couche-dechets.ts";
import { palierDe } from "./dechets.ts";
import { heurte, zoneDe, type LieuJouable } from "./lieux.ts";
import { OBJETS } from "./objets.ts";

function bilan(cle: string) {
  const d = dispositionLieu(cle);
  let emplacements = 0;
  let conteneurs = 0;
  const pieces = [];
  for (const [k, l] of d) {
    emplacements += l.length;
    conteneurs += l.filter((e) => e.genre !== "sol").length;
    const [cx, cz] = k.split(",").map(Number) as [number, number];
    pieces.push(...piecesCarreau(cle, cx, cz, 0));
  }
  return { d, emplacements, conteneurs, pieces };
}

test("les densités du §4.1 : ≈ 85 emplacements à la halte, ≈ 20 au Carrefour, ≈ 60 à la Coopérative", () => {
  const halte = bilan("station");
  assert.ok(halte.emplacements >= 55 && halte.emplacements <= 110, `halte : ${halte.emplacements}`);
  assert.ok(halte.conteneurs >= 10, "des sacs-poubelle à fouiller à la halte");
  const carrefour = bilan("comptoir");
  assert.ok(carrefour.emplacements >= 12 && carrefour.emplacements <= 28, `Carrefour : ${carrefour.emplacements}`);
  const coop = bilan(cleCouche("cooperative", 7));
  assert.ok(coop.emplacements >= 40 && coop.emplacements <= 90, `Coopérative : ${coop.emplacements}`);
});

test("une graine, toujours le même contenu ; un remplissage neuf, un tirage neuf", () => {
  const a = piecesCarreau("station", 5, 1, 0);
  assert.deepEqual(piecesCarreau("station", 5, 1, 0), a);
  const b = piecesCarreau("station", 5, 1, 1);
  assert.equal(b.length > 0, true);
  assert.notDeepEqual(b.map((p) => p.objet), a.map((p) => p.objet));
  // La disposition ne bouge pas d'un remplissage à l'autre : les conteneurs restent à leur place.
  assert.deepEqual(
    a.filter((p) => p.dedans).map((p) => [p.x, p.z]).slice(0, 1),
    b.filter((p) => p.dedans).map((p) => [p.x, p.z]).slice(0, 1),
  );
});

test("le terrain personnel : 12 déchets de départ, dont 3 sacs-poubelle, une pièce chacun", () => {
  for (const id of [1, 2, 3, 42]) {
    const { emplacements, conteneurs, d } = bilan(cleCouche("terrain", id));
    assert.equal(emplacements, 12, `terrain ${id}`);
    assert.equal(conteneurs, 3);
    for (const l of d.values()) for (const e of l) if (e.genre === "sol") assert.equal(e.n, 1);
  }
  // Deux terrains n'ont pas les mêmes déchets.
  assert.notDeepEqual([...dispositionLieu("terrain:1").values()], [...dispositionLieu("terrain:2").values()]);
});

test("rien n'est posé dans un mur, et les pièces au sol ne sont jamais minuscules", () => {
  for (const cle of ["station", "comptoir", "cooperative:3", "terrain:3"]) {
    const lieu = cle.split(":")[0] as LieuJouable;
    const zone = zoneDe(lieu);
    for (const l of dispositionLieu(cle).values()) for (const e of l) assert.ok(!heurte(zone, e.x, e.z, 0.4), `${cle} : ${e.x}, ${e.z}`);
    for (const p of bilan(cle).pieces) if (!p.dedans) assert.ok(!["ecouteur_seul", "carte_platine", "briquet_vide"].includes(p.objet), p.objet);
  }
});

test("au Carrefour, rien que des déchets ; ailleurs, surtout des déchets", () => {
  for (const p of bilan("comptoir").pieces) assert.equal(palierDe(p.objet), "dechet", p.objet);
  const halte = bilan("station").pieces;
  const dechets = halte.filter((p) => palierDe(p.objet) === "dechet").length / halte.length;
  assert.ok(dechets > 0.5 && dechets < 0.9, `part des déchets : ${dechets}`);
});

test("les points du monde : sur une place libre ; un événement revient ailleurs", () => {
  for (const [lieu, points] of Object.entries(POINTS_LIEUX) as [LieuJouable, typeof POINTS_LIEUX.station][]) {
    for (const p of points ?? []) {
      for (const [x, z] of p.places) assert.ok(!heurte(zoneDe(lieu), x, z, 0.3), `${lieu} ${p.id}`);
      assert.ok(contenuPointCycle(lieu, p, 0).length > 0, `${p.id} contient quelque chose`);
      if (p.places.length > 1) assert.notDeepEqual(placePoint(lieu, p, 0), placePoint(lieu, p, 1), p.id);
    }
  }
  // Le vélo du fossé se démonte en pièces de vélo.
  const velo = POINTS_LIEUX.station!.find((p) => p.id === "velo")!;
  assert.deepEqual([...new Set(contenuPointCycle("station", velo, 0))].sort(), ["cadre_velo", "chaine_velo", "dynamo_velo", "roue_velo"]);
});

test("les références des conteneurs et des points se lisent ; le reste est refusé", () => {
  assert.deepEqual(lireRef(refConteneur(3, -1, 4)), { genre: "conteneur", cx: 3, cz: -1, e: 4 });
  assert.deepEqual(lireRef("p:velo"), { genre: "point", id: "velo" });
  assert.equal(lireRef("p:../x"), null);
  assert.equal(lireRef("toString"), null);
});

test("les zones ne débordent pas de leur lieu et les objets existent", () => {
  for (const [lieu, zones] of Object.entries(ZONES_DECHETS) as [LieuJouable, typeof ZONES_DECHETS.station][]) {
    const z = zoneDe(lieu);
    for (const r of zones) assert.ok(r.x0 >= z.xMin - 0.01 && r.x1 <= z.xMax + 0.01 && r.z0 >= z.zMin - 0.01 && r.z1 <= z.zMax + 0.01, `${lieu} ${r.type}`);
  }
  for (const p of bilan("station").pieces) assert.ok(OBJETS[p.objet], p.objet);
});
