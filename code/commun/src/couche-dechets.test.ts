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
import { CONTENEURS, PROFILS_DECHETS, contenuConteneur, graineDe, palierDe, type TypeConteneur, type TypeLieuDechets } from "./dechets.ts";
import { heurte, zoneDe, type LieuJouable } from "./lieux.ts";
import { OBJETS, type TypeObjet } from "./objets.ts";

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

// Bug de la 0.7 (0.7.1) : « à la Coopérative, j'en ai fouillé 10, aucun ne contenait quelque chose ». Le tirage n'y
// était pour rien (la liste de la fouille ne s'affichait pas, rendu/dechets/couche.ts) ; ce test tient la promesse
// du porteur : au moins 3 conteneurs sur 4 ont quelque chose à la première fouille, partout, à chaque remplissage.
test("au moins 3 conteneurs sur 4 contiennent un objet, dans chaque lieu, sur un grand nombre de graines", () => {
  const compter = (cles: string[], remplissages: number) => {
    let conteneurs = 0;
    let pleins = 0;
    for (const cle of cles) {
      for (const [k, l] of dispositionLieu(cle)) {
        const [cx, cz] = k.split(",").map(Number) as [number, number];
        for (let r = 0; r < remplissages; r++) {
          const pieces = piecesCarreau(cle, cx, cz, r);
          for (const em of l) {
            if (em.genre === "sol") continue;
            conteneurs++;
            // Ce que le client dessine (plein ou vidé) vient de ces mêmes pièces : plein si et seulement s'il y a un objet.
            if (pieces.some((p) => p.e === em.e && p.dedans)) pleins++;
          }
        }
      }
    }
    return { conteneurs, pleins };
  };
  const ids = Array.from({ length: 150 }, (_, i) => i + 1);
  const lieux = {
    cooperative: compter(ids.map((i) => cleCouche("cooperative", i)), 3),
    terrain: compter(ids.map((i) => cleCouche("terrain", i)), 1),
    station: compter(["station"], 200),
  };
  for (const [lieu, { conteneurs, pleins }] of Object.entries(lieux)) {
    assert.ok(conteneurs > 100, `${lieu} : ${conteneurs} conteneurs`);
    assert.ok(pleins / conteneurs >= 0.75, `${lieu} : ${pleins} pleins sur ${conteneurs}`);
  }
  // Les coffres d'épave (des points qui se fouillent), sur 200 cycles.
  for (const p of POINTS_LIEUX.station!.filter((x) => x.type === "coffre_voiture")) {
    let pleins = 0;
    for (let c = 0; c < 200; c++) if (contenuPointCycle("station", p, c).length > 0) pleins++;
    assert.ok(pleins / 200 >= 0.75, `${p.id} : ${pleins} sur 200`);
  }
});

test("chaque type de conteneur, dans chaque type de lieu, contient au moins un objet ; les trois paliers tiennent", () => {
  for (const lieu of Object.keys(PROFILS_DECHETS) as TypeLieuDechets[]) {
    for (const conteneur of Object.keys(CONTENEURS) as TypeConteneur[]) {
      const parts: Record<string, number> = { dechet: 0, petite: 0, bonne: 0 };
      let pleins = 0;
      let objets = 0;
      const N = 2000;
      for (let g = 0; g < N; g++) {
        const contenu = contenuConteneur(graineDe("essai", lieu, conteneur, g), lieu, conteneur);
        let n = 0;
        for (const [t, x] of Object.entries(contenu)) {
          parts[palierDe(t as TypeObjet)]! += x ?? 0;
          n += x ?? 0;
        }
        objets += n;
        if (n > 0) pleins++;
      }
      assert.ok(pleins / N >= 0.75, `${lieu}/${conteneur} : ${pleins} sur ${N}`);
      if (PROFILS_DECHETS[lieu].seulementDechets) continue;
      // ≈ 70 % de déchets, ≈ 25 % de petites trouvailles, ≈ 5 % de bonnes (à quelques points près).
      assert.ok(Math.abs(parts.dechet! / objets - 0.7) < 0.05, `${lieu}/${conteneur} déchets ${parts.dechet! / objets}`);
      assert.ok(Math.abs(parts.petite! / objets - 0.25) < 0.05, `${lieu}/${conteneur} petites ${parts.petite! / objets}`);
    }
  }
});
