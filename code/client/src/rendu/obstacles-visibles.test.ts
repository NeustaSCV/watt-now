// 0.7.1 : « soit il y a un obstacle physique, soit on peut passer » (le porteur du projet). Pour chaque lieu, on
// construit son décor 3D (sans navigateur : une toile de dessin factice suffit) et on vérifie, avec le contrôle des
// obstacles (controle-obstacles.ts, le même que le mode `?obstacles=1`) :
// - que chaque obstacle de déplacement a quelque chose de visible sur tout son pourtour ;
// - que chaque bord de zone qu'on touche à pied (hors sorties) est matérialisé (grillage, haie, lisière, fourré…).
// Le Comptoir du Carrefour d'abord, sans aucune tolérance ; puis la halte, la Coopérative et le terrain ; puis le gué et
// le Moulin (plan 0.8.2, chantier F) : hors de l'eau, un obstacle sans rien de visible est un défaut.

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
// Les gardes du Comptoir chargent leur corps (glTF) par le réseau : ici, ce chargement attend pour toujours (sans effet
// sur le décor, qui seul compte). Ce fichier de test tourne dans son propre processus : rien d'autre n'est touché.
Object.assign(globalThis, {
  Request: class {
    url: string;
    constructor(url: string) {
      this.url = url;
    }
  },
  fetch: () => new Promise(() => {}),
});

const { creerComptoir } = await import("./comptoir.ts");
const { creerHalte } = await import("./halte.ts");
const { creerCooperative } = await import("./cooperative.ts");
const { creerTerrain } = await import("./terrain.ts");
const { creerMare, VueRessource } = await import("./ressources.ts");
const { creerRuine } = await import("./ruine.ts");
const { RenduGue } = await import("./gue.ts");
const { creerMoulin } = await import("./moulin.ts");
const { dansLaRiviere } = await import("../../../commun/src/gue.ts");
const { controlerLieu } = await import("./controle-obstacles.ts");
const { genererHalte } = await import("../../../commun/src/halte.ts");
const { ZONE_COMPTOIR, bordsLibres, sortiesDe, zoneDe } = await import("../../../commun/src/lieux.ts");

type Lieu = "comptoir" | "station" | "cooperative" | "terrain" | "gue" | "moulin";

/** Ce qu'on voit dans chaque lieu : son décor, et à la halte les vestiges posés par le serveur (les épaves de la route). */
function visibles(lieu: Lieu): THREE.Object3D[] {
  switch (lieu) {
    case "comptoir":
      return [creerComptoir()];
    case "station":
      return [creerHalte(), ...genererHalte().map((r) => new VueRessource({ ...r, disponible: true }).objet)];
    case "cooperative":
      return [creerCooperative()];
    case "terrain":
      return [creerTerrain(), creerMare(), creerRuine()];
    case "gue":
    {
      const gue = new RenduGue(() => {});
      gue.creer();
      return [gue.toutConstruire()];
    }
    case "moulin":
      return [creerMoulin()];
  }
}

/** `horsDeLEau` : on ne garde que les obstacles qui ne sont pas dans l'eau (au gué, l'eau elle-même arrête le pas). */
function decrire(lieu: Lieu, tolerance: number, horsDeLEau: (b: { x: number; z: number; l: number; p: number }) => boolean = () => true): string[] {
  const c = controlerLieu(zoneDe(lieu), sortiesDe(lieu), visibles(lieu));
  const fautes: string[] = [];
  for (const o of c.obstacles) {
    if (!horsDeLEau(o.boite)) continue;
    if (o.couverture < 1 - tolerance) fautes.push(`${lieu} : obstacle (x ${o.boite.x}, z ${o.boite.z}, ${o.boite.l} × ${o.boite.p}) sans rien de visible sur ${Math.round((1 - o.couverture) * 100)} % de son pourtour, vers (${o.trous[0]!.x.toFixed(1)}, ${o.trous[0]!.z.toFixed(1)})`);
  }
  for (const b of c.bords) {
    if (b.trous.length) fautes.push(`${lieu} : bord invisible de (${b.morceau.x1.toFixed(1)}, ${b.morceau.z1.toFixed(1)}) à (${b.morceau.x2.toFixed(1)}, ${b.morceau.z2.toFixed(1)})`);
  }
  return fautes;
}

test("0.7.1 Comptoir : chaque obstacle se voit sur tout son pourtour, et l'on ne touche aucune borne hors des sorties", () => {
  assert.deepEqual(decrire("comptoir", 0), []);
  // Plus fort : l'enceinte est fermée, aucune borne n'est atteignable à pied (seules les sorties mènent au bord).
  assert.deepEqual(bordsLibres(ZONE_COMPTOIR, sortiesDe("comptoir")), []);
});

test("0.7.1 halte, Coopérative, terrain : pas de barrière invisible", () => {
  // Une tolérance de 5 % du pourtour : les engins posés de biais (camionnette de la Coopérative) ont des coins vides
  // de quelques centimètres dans leur boîte alignée sur les axes ; l'éboulis du goulet est semé au hasard.
  for (const lieu of ["station", "cooperative", "terrain"] as const) assert.deepEqual(decrire(lieu, 0.05), [], lieu);
});

// Plan 0.8.2 (chantier F) : le gué et le Moulin (sans exception depuis la 0.8.3). Au gué, l'eau (la rivière, le couloir du bac, le radier noyé) arrête le
// pas sans rien de dressé : elle se voit, c'est l'eau ; on ne contrôle que les obstacles posés sur la terre ferme.
const surLaTerre = (b: { x: number; z: number; l: number; p: number }) => !dansLaRiviere(b.x, b.z, -0.6);

test("0.8.2 gué : hors de l'eau, pas de barrière invisible", () => {
  assert.deepEqual(decrire("gue", 0.05, surLaTerre), []);
});

test("0.8.3 Moulin : pas de barrière invisible (les sept bords du lot ont leur haie ou leur muret)", () => {
  assert.deepEqual(decrire("moulin", 0.05), []);
});
