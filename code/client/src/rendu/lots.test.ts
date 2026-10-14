// 0.7.2 : les lots acceptent le greffon « brouillard » de la vue par pièce. Sans cela, revenir dans un lieu à murs
// (dont les matériaux ont été brouillés à la première visite) défaisait tous les lots : un appel de dessin par morceau.

import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { brouiller, estBrouille } from "./carte-vue.ts";
import { LotsDeRessources } from "./lots.ts";

/** Une « ressource » : un groupe de deux morceaux, chacun de sa couleur. */
function ressource(x: number, couleurs: number[], brouille: boolean) {
  const objet = new THREE.Group();
  objet.position.x = x;
  for (const c of couleurs) {
    const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true });
    if (brouille) brouiller(m);
    objet.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), m));
  }
  return { objet, surVisibilite: null as ((visible: boolean) => void) | null };
}

test("lots : des matériaux brouillés identiques (sauf la couleur) tiennent dans un seul lot, lui-même brouillé", () => {
  const lots = new LotsDeRessources();
  for (let i = 0; i < 5; i++) lots.prendre(ressource(i * 3, [0x884422, 0x224488], true));
  lots.construire();
  assert.equal(lots.groupe.children.length, 1, "un seul lot (un appel de dessin) pour les dix morceaux");
  const lot = lots.groupe.children[0] as THREE.BatchedMesh;
  assert.ok(estBrouille(lot.material as THREE.Material), "le lot garde le greffon");
  lots.vider();
});

test("lots : un matériau brouillé ne se mélange pas à un matériau qui ne l'est pas (deux programmes différents)", () => {
  const lots = new LotsDeRessources();
  lots.prendre(ressource(0, [0x884422], true));
  lots.prendre(ressource(3, [0x884422], false));
  lots.construire();
  assert.equal(lots.groupe.children.length, 2);
  const brouilles = lots.groupe.children.filter((l) => estBrouille((l as THREE.Mesh).material as THREE.Material));
  assert.equal(brouilles.length, 1);
  lots.vider();
});

test("lots : un matériau brouillé après une première signature (lieu revisité) est reconnu à nouveau", () => {
  const m = new THREE.MeshStandardMaterial({ color: 0x336633 });
  const avant = new LotsDeRessources();
  const objet = new THREE.Group();
  objet.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), m));
  avant.prendre({ objet, surVisibilite: null });
  avant.construire();
  assert.ok(!estBrouille((avant.groupe.children[0] as THREE.Mesh).material as THREE.Material));
  avant.vider();
  brouiller(m);
  const apres = new LotsDeRessources();
  const objet2 = new THREE.Group();
  objet2.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), m));
  apres.prendre({ objet: objet2, surVisibilite: null });
  apres.construire();
  assert.equal(apres.groupe.children.length, 1, "toujours regroupé");
  assert.ok(estBrouille((apres.groupe.children[0] as THREE.Mesh).material as THREE.Material));
  apres.vider();
});

test("lots : une ressource semée qui reparaît ailleurs (plan 0.9) emmène ses morceaux dans leur lot", () => {
  const lots = new LotsDeRessources();
  const r = ressource(2, [0x884422], false);
  lots.prendre(r);
  lots.prendre(ressource(9, [0x884422], false));
  lots.construire();
  const lot = lots.groupe.children[0] as THREE.BatchedMesh;
  r.objet.position.set(12, 0, 5);
  lots.deplacer(r, { dx: 10, dz: 5 });
  const m = new THREE.Matrix4();
  lot.getMatrixAt(0, m);
  const p = new THREE.Vector3().setFromMatrixPosition(m);
  assert.deepEqual([p.x, p.z], [12, 5], "le morceau a suivi");
  lot.getMatrixAt(1, m);
  assert.equal(new THREE.Vector3().setFromMatrixPosition(m).x, 9, "l'autre n'a pas bougé");
  lots.vider();
});
