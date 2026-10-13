// La vue d'ensemble à l'arrivée (0.8.2, chantier G ; R4) : tout le lieu tient à l'écran, toits compris ; le zoom part au
// premier geste, garde le personnage dans le cadre, et finit sur lui, au zoom du joueur.

import { test } from "node:test";
import assert from "node:assert/strict";
import { zoneDe, type LieuId } from "../../../commun/src/lieux.ts";
import { DUREE_ZOOM, VueEnsemble, boiteDeLaVue, cadrerEnsemble, type BoiteVue } from "./vue-ensemble.ts";
import { ELEVATION, demiLargeurDeBase, type Cadrage } from "./scene.ts";

const LACET = Math.PI / 4;

/** Où tombe un point du monde à l'écran, en fraction de la demi-largeur et de la demi-hauteur (−1 à 1 : dedans). */
function aLEcran(c: Cadrage, p: { x: number; y?: number; z: number }, largeur: number, hauteur: number, lacet = LACET) {
  const dx = p.x - c.x;
  const dz = p.z - c.z;
  const sx = dx * Math.sin(lacet) - dz * Math.cos(lacet);
  const sy = (-dx * Math.cos(lacet) - dz * Math.sin(lacet)) * Math.sin(ELEVATION) + (p.y ?? 0) * Math.cos(ELEVATION);
  const demiL = demiLargeurDeBase(largeur / hauteur) * c.zoom;
  const demiH = demiL / (largeur / hauteur);
  return { x: sx / demiL, y: sy / demiH };
}

function coins(b: BoiteVue) {
  return [b.xMin, b.xMax].flatMap((x) => [b.zMin, b.zMax].flatMap((z) => [{ x, z }, { x, y: 9, z }]));
}

const ECRANS = [
  { nom: "375 × 630", l: 375, h: 630 },
  { nom: "812 × 320", l: 812, h: 320 },
  { nom: "1440 × 900", l: 1440, h: 900 },
];
const LIEUX: LieuId[] = ["terrain", "station", "comptoir", "cooperative", "gue", "moulin"];

test("tout le lieu tient à l'écran, toits compris, aux trois tailles et sous les quatre angles", () => {
  for (const lieu of LIEUX) {
    const zone = zoneDe(lieu);
    const boite = boiteDeLaVue(lieu, zone, { x: (zone.xMin + zone.xMax) / 2, z: (zone.zMin + zone.zMax) / 2 });
    for (const e of ECRANS) {
      for (let q = 0; q < 4; q++) {
        const lacet = LACET + (q * Math.PI) / 2;
        const c = cadrerEnsemble(boite, lacet, e.l, e.h);
        assert.ok(c.zoom > 1.5, `${lieu} ${e.nom} : on voit de loin (zoom ${c.zoom.toFixed(2)})`);
        let bord = 0;
        for (const p of coins(boite)) {
          const s = aLEcran(c, p, e.l, e.h, lacet);
          assert.ok(Math.abs(s.x) <= 1.0001 && Math.abs(s.y) <= 1.0001, `${lieu} ${e.nom} : ${JSON.stringify(p)} hors cadre (${s.x.toFixed(2)}, ${s.y.toFixed(2)})`);
          bord = Math.max(bord, Math.abs(s.x), Math.abs(s.y));
        }
        assert.ok(bord > 0.85, `${lieu} ${e.nom} : le lieu remplit l'écran (${bord.toFixed(2)})`);
      }
    }
  }
});

test("en portrait, le lieu tient sous le HUD du haut", () => {
  const zone = zoneDe("cooperative");
  const boite = boiteDeLaVue("cooperative", zone, { x: 0, z: 0 });
  const c = cadrerEnsemble(boite, LACET, 375, 630, 0.27);
  for (const p of coins(boite)) {
    const s = aLEcran(c, p, 375, 630);
    assert.ok(Math.abs(s.x) <= 1.0001 && s.y >= -1.0001 && s.y <= 1 - 2 * 0.27 + 1e-4, `${JSON.stringify(p)} sous le HUD (${s.y.toFixed(2)})`);
  }
});

test("au gué, on montre le tronçon d'arrivée et son voisin vers le milieu (100 × 70 m)", () => {
  const zone = zoneDe("gue");
  assert.deepEqual(boiteDeLaVue("gue", zone, { x: 196, z: 30 }), { xMin: 100, xMax: 200, zMin: 0, zMax: 70 });
  assert.deepEqual(boiteDeLaVue("gue", zone, { x: 4, z: 30 }), { xMin: 0, xMax: 100, zMin: 0, zMax: 70 });
  assert.deepEqual(boiteDeLaVue("gue", zone, { x: 60, z: 30 }), { xMin: 50, xMax: 150, zMin: 0, zMax: 70 });
});

test("l'attente garde la vue d'ensemble ; le geste lance un zoom de 1,5 s qui finit sur le personnage", () => {
  const v = new VueEnsemble();
  const depart = { x: 25, z: 25, zoom: 5 };
  const joueur = { x: 40, z: 44 };
  assert.equal(v.cadrage(0, joueur, 1), null, "rien avant l'arrivée");
  v.commencer(depart);
  assert.equal(v.etat, "attente");
  assert.deepEqual(v.cadrage(10_000, joueur, 1), depart, "on attend aussi longtemps qu'il faut");
  assert.equal(v.toitsVisibles(10_000), true);
  v.lancer(10_000);
  assert.deepEqual(v.cadrage(10_000, joueur, 1), depart, "le zoom part de la vue d'ensemble, sans saut");
  let zoomAvant = depart.zoom;
  for (let t = 0; t < DUREE_ZOOM; t += 50) {
    const c = v.cadrage(10_000 + t, joueur, 1)!;
    assert.ok(c.zoom <= zoomAvant + 1e-9, "le zoom ne fait que se resserrer");
    zoomAvant = c.zoom;
    const s = aLEcran(c, joueur, 375, 630);
    assert.ok(Math.abs(s.x) <= 1 && Math.abs(s.y) <= 1, `le personnage reste dans le cadre à ${t} ms`);
  }
  const presque = v.cadrage(10_000 + DUREE_ZOOM - 1, joueur, 1)!;
  assert.ok(Math.hypot(presque.x - joueur.x, presque.z - joueur.z) < 0.01 && Math.abs(presque.zoom - 1) < 0.01, "il finit sur le personnage, au zoom du joueur");
  assert.equal(v.toitsVisibles(10_000 + DUREE_ZOOM - 1), false, "les toits s'effacent comme d'habitude à la fin");
  assert.equal(v.cadrage(10_000 + DUREE_ZOOM, joueur, 1), null, "fini : la caméra le suit de nouveau");
  assert.equal(v.etat, null);
});

test("le zoom va au zoom habituel du joueur (molette), pas forcément 1", () => {
  const v = new VueEnsemble();
  v.commencer({ x: 0, z: 0, zoom: 6 });
  v.lancer(0);
  const c = v.cadrage(DUREE_ZOOM - 1, { x: 3, z: 4 }, 1.4)!;
  assert.ok(Math.abs(c.zoom - 1.4) < 0.01);
});
