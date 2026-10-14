// Plan 0.10, chantier I : la corniche à l'écran. Les tronçons se construisent autour du joueur ; le pin tombé se montre
// débité quand on l'a vidé (chacun voit le sien) ; la porte de la barricade s'ouvre pour qui a payé le péage ; les objets
// du modèle tombent là où le jeu les place.

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

const { RenduCorniche } = await import("./corniche.ts");
const { BARRICADE, CAISSE_PEAGE, PIN_TOMBE, SORTIES_CORNICHE } = await import("../../../commun/src/corniche.ts");

/** Le centre (dans le repère du jeu) d'un objet du décor. */
function centre(o: THREE.Object3D): THREE.Vector3 {
  let racine = o;
  while (racine.parent) racine = racine.parent;
  racine.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(o, true).getCenter(new THREE.Vector3());
}

test("les tronçons se construisent autour du joueur : le sien et ses voisins", () => {
  const c = new RenduCorniche();
  c.creer();
  const arrivee = SORTIES_CORNICHE[0]!.arrivee;
  c.animer(arrivee, 0.016, Math.PI / 4, []);
  assert.deepEqual(c.construits.sort(), ["montee", "tunnel"]);
  c.animer({ x: 120, z: 37 }, 0.016, Math.PI / 4, []);
  assert.deepEqual(c.construits.sort(), ["eboulement", "panoramique", "tunnel"]);
});

test("le pin tombé, la caisse et la barricade du modèle sont là où le jeu les place", () => {
  const c = new RenduCorniche();
  c.creer();
  c.toutConstruire();
  const pin = centre(c.objet("pin_entier")!);
  assert.ok(Math.hypot(pin.x - PIN_TOMBE.x, pin.z - PIN_TOMBE.z) < 4, `le pin (${pin.x.toFixed(1)}, ${pin.z.toFixed(1)})`);
  const caisse = centre(c.objet("caisse_peage")!);
  assert.ok(Math.hypot(caisse.x - CAISSE_PEAGE.x, caisse.z - CAISSE_PEAGE.z) < 0.6, "la caisse du péage");
  const porte = centre(c.objet("barricade_fermee")!);
  assert.ok(Math.abs(porte.x - BARRICADE.x) < 0.3 && Math.abs(porte.z - BARRICADE.z) < 0.6, "la porte de la barricade");
});

test("le pin se montre débité quand je l'ai vidé, entier quand il est revenu ; la barricade s'ouvre pour qui a payé", () => {
  const c = new RenduCorniche();
  c.creer();
  c.toutConstruire();
  const entier = c.objet("pin_entier")!;
  const debite = c.objet("pin_debite")!;
  assert.ok(entier.visible && !debite.visible, "au départ, le pin entier");
  const pin = { donnees: { id: 1, type: "pin_tombe" as const, x: PIN_TOMBE.x, z: PIN_TOMBE.z, disponible: true, reste: 3 } };
  c.animer(PIN_TOMBE, 0.016, Math.PI / 4, [pin]);
  assert.ok(entier.visible, "entamé, il reste là");
  pin.donnees.disponible = false;
  pin.donnees.reste = 0;
  c.animer(PIN_TOMBE, 0.016, Math.PI / 4, [pin]);
  assert.ok(!entier.visible && debite.visible, "vidé : les rondelles et la souche");
  pin.donnees.disponible = true;
  pin.donnees.reste = 10;
  c.animer(PIN_TOMBE, 0.016, Math.PI / 4, [pin]);
  assert.ok(entier.visible && !debite.visible, "revenu");
  assert.ok(c.objet("barricade_fermee")!.visible && !c.objet("barricade_ouverte")!.visible);
  c.barricade(true);
  assert.ok(!c.objet("barricade_fermee")!.visible && c.objet("barricade_ouverte")!.visible);
});

test("la nuit, les lumières du modèle s'allument (le brasero des pillards, le feu de la terrasse) ; le jour, aucune", () => {
  const c = new RenduCorniche();
  assert.deepEqual(c.lumieres(false), []);
  const nuit = c.lumieres(true);
  assert.ok(nuit.length >= 8 && nuit.length <= 10);
  assert.ok(nuit.some((l) => l.vacillement > 0), "les flammes vacillent");
});
