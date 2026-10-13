// Plan 0.8.2 (chantier F, décision du porteur) : la couche « berge » du gué. Plus nature que la route : la moitié de
// la densité des bas-côtés de la station, ≈ 10 % de sacs échoués ; ≈ 50 % de ce que la rivière laisse (bois flotté,
// fibres, plumes, os), ≈ 35 % de ce que la crue charrie, ≈ 15 % de la pêche et de la guinguette. Aucun objet nouveau.

import { test } from "node:test";
import assert from "node:assert/strict";
import { CONTENEURS, PROFILS_DECHETS, contenuConteneur, graineDe, piecesAmas, tableDechets, type TypeConteneur } from "./dechets.ts";
import { ZONES_DECHETS, dispositionLieu, piecesCarreau } from "./couche-dechets.ts";
import { dansLaRiviere } from "./gue.ts";
import { OBJETS, type TypeObjet } from "./objets.ts";

const BERGE = PROFILS_DECHETS.berge;
const groupeDe = (t: TypeObjet) => BERGE.groupes!.find((g) => t in g.objets)?.nom;

test("la berge : la moitié de la densité de la route de la station, ≈ 10 % de contenants, que des objets du catalogue", () => {
  assert.equal(BERGE.densite, PROFILS_DECHETS.route.densite / 2);
  assert.ok(Math.abs(BERGE.partConteneurs - 0.1) < 1e-9);
  for (const g of BERGE.groupes!) for (const t of Object.keys(g.objets)) assert.ok(OBJETS[t as TypeObjet], `${t} existe`);
  assert.deepEqual(BERGE.groupes!.map((g) => g.part), [0.5, 0.35, 0.15]);
  // La table liste ce qu'on peut y trouver (pour le catalogue des trouvables).
  const t = tableDechets("berge", "sol");
  assert.ok([...t.dechet, ...t.petite, ...t.bonne].some(([x]) => x === "plumes"));
});

test("la berge, sur un grand tirage : ≈ 50 % de la rivière, ≈ 35 % de la crue, ≈ 15 % de la pêche et de la guinguette, rarement une bonne trouvaille", () => {
  const compte = new Map<string, number>();
  let n = 0;
  let vedettes = 0;
  for (let g = 0; g < 4000; g++) {
    for (const t of piecesAmas(graineDe("berge", g), "berge", 3)) {
      compte.set(groupeDe(t)!, (compte.get(groupeDe(t)!) ?? 0) + 1);
      if (t === "sac_charbon_bbq" || t === "tente_popup") vedettes++;
      n++;
    }
  }
  const part = (nom: string) => (compte.get(nom) ?? 0) / n;
  assert.ok(Math.abs(part("la rivière") - 0.5) < 0.02, `rivière ${part("la rivière")}`);
  assert.ok(Math.abs(part("ce que la crue charrie") - 0.35) < 0.02, `crue ${part("ce que la crue charrie")}`);
  assert.ok(Math.abs(part("la pêche et la guinguette") - 0.15) < 0.02, `guinguette ${part("la pêche et la guinguette")}`);
  assert.ok(vedettes / n > 0 && vedettes / n < 0.02, `les vedettes, rares (${vedettes} sur ${n})`);
  // Un sac échoué : jamais vide, rien de trop lourd.
  for (const c of Object.keys(CONTENEURS) as TypeConteneur[]) {
    for (let g = 0; g < 300; g++) {
      const contenu = contenuConteneur(graineDe("sac", c, g), "berge", c);
      assert.ok(Object.keys(contenu).length > 0);
      for (const t of Object.keys(contenu)) assert.ok(OBJETS[t as TypeObjet].poids <= 8, t);
    }
  }
});

test("au gué : surtout des berges, un peu de route ; rien dans l'eau, à aucun remplissage", () => {
  const zones = ZONES_DECHETS.gue;
  assert.ok(zones.some((z) => z.type === "berge") && zones.some((z) => z.type === "route"));
  const surface = (type: string) => zones.filter((z) => z.type === type).reduce((s, z) => s + (z.x1 - z.x0) * (z.z1 - z.z0), 0);
  assert.ok(surface("berge") > surface("route"), "les berges d'abord");
  for (const [cle, liste] of dispositionLieu("gue")) {
    const [cx, cz] = cle.split(",").map(Number) as [number, number];
    for (const e of liste) assert.ok(!dansLaRiviere(e.x, e.z), `(${e.x}, ${e.z}) dans l'eau`);
    for (let r = 0; r < 20; r++) for (const p of piecesCarreau("gue", cx, cz, r)) assert.ok(!dansLaRiviere(p.x, p.z, -0.3), `${p.objet} en (${p.x}, ${p.z}) dans l'eau`);
  }
});
