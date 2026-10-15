// La vue d'ensemble à l'arrivée (0.8.2, chantier G ; R4) : tout le lieu tient à l'écran, toits compris ; le zoom part au
// premier geste, garde le personnage dans le cadre, et finit sur lui, au zoom du joueur.

import { test } from "node:test";
import assert from "node:assert/strict";
import { zoneDe, type LieuId } from "../../../commun/src/lieux.ts";
import { DUREE_ZOOM, FONDU_BRUME, VueEnsemble, boiteDeLaVue, cadrerEnsemble, tronconsVoulus, type BoiteVue } from "./vue-ensemble.ts";
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

test("au gué, on montre tout le lieu (0.10, R52 : ses quatre tronçons sont construits pendant la vue d'ensemble)", () => {
  const zone = zoneDe("gue");
  for (const x of [196, 4, 60]) assert.deepEqual(boiteDeLaVue("gue", zone, { x, z: 30 }), { xMin: 0, xMax: 200, zMin: 0, zMax: 70 });
});

test("les tronçons voulus : en jeu, le joueur et ses voisins ; pendant la vue d'ensemble, tous, les lointains un par image", () => {
  const ordre = ["a", "b", "c", "d"] as const;
  const construits = new Set<string>();
  // En jeu, au premier tronçon : lui et son voisin, tout de suite.
  let r = tronconsVoulus(ordre, 0, false, construits);
  assert.deepEqual([...r.voulus], ["a", "b"]);
  assert.deepEqual(r.aConstruire, ["a", "b"]);
  // La vue d'ensemble : les deux proches, puis un lointain par image, jusqu'à tous.
  r = tronconsVoulus(ordre, 0, true, construits);
  assert.deepEqual([...r.voulus], ["a", "b", "c", "d"]);
  assert.deepEqual(r.aConstruire, ["a", "b", "c"]);
  for (const id of r.aConstruire) construits.add(id);
  r = tronconsVoulus(ordre, 0, true, construits);
  assert.deepEqual(r.aConstruire, ["d"]);
  construits.add("d");
  assert.deepEqual(tronconsVoulus(ordre, 0, true, construits).aConstruire, []);
  // Après le zoom : on revient au jeu, les lointains ne sont plus voulus (ils seront défaits).
  r = tronconsVoulus(ordre, 0, false, construits);
  assert.deepEqual([...r.voulus], ["a", "b"]);
  assert.deepEqual(r.aConstruire, []);
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

test("la brume de l'aube (0.10.1, A10) : masquée pendant la vue d'ensemble et le zoom, puis un fondu d'une seconde", () => {
  const v = new VueEnsemble();
  const joueur = { x: 10, z: 10 };
  assert.equal(v.brume(0), 1, "sans vue d'ensemble (une connexion) : toute la brume");
  v.commencer({ x: 30, z: 30, zoom: 4 });
  assert.equal(v.brume(5000), 0, "on regarde le lieu de loin : pas de brume");
  v.lancer(10_000);
  v.cadrage(10_000 + DUREE_ZOOM / 2, joueur, 1);
  assert.equal(v.brume(10_000 + DUREE_ZOOM / 2), 0, "pendant le zoom : pas de brume");
  const fin = 10_000 + DUREE_ZOOM;
  assert.equal(v.cadrage(fin, joueur, 1), null, "le zoom est fini");
  assert.equal(v.brume(fin), 0);
  assert.equal(v.brume(fin + FONDU_BRUME / 2), 0.5, "elle revient en fondu");
  assert.equal(v.brume(fin + FONDU_BRUME), 1);
  assert.ok(FONDU_BRUME >= 800 && FONDU_BRUME <= 1200, "≈ 1 s");
});
