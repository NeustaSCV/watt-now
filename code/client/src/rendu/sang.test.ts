// 0.10 : le sang au bon endroit. Au phare, un coup sur la grève (≈ 9 m sous le plateau) ou sur le pont de l'épave
// (≈ − 4) jaillit de la hauteur du sol où l'on se bat, et ses taches s'y posent ; ailleurs, le sol est plat : rien ne bouge.

import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";

// Une toile de dessin factice (le décor du phare, importé avec sa hauteur du sol, dessine ses enseignes dans le vide).
const contexte2d: unknown = new Proxy(
  {},
  {
    get: (_cible, nom) => {
      if (nom === "measureText") return () => ({ width: 10 });
      return () => ({ addColorStop() {} });
    },
    set: () => true,
  },
);
if (!(globalThis as { document?: unknown }).document) Object.assign(globalThis, { document: { createElement: () => ({ width: 1, height: 1, style: {}, getContext: () => contexte2d }) } });

const { Sang } = await import("./sang.ts");
const { hauteurSolLieu } = await import("../sol-lieu.ts");
const { jeu } = await import("../../../commun/src/phare.ts");

/** Le groupe du sang dans la scène, et ce qu'il contient : les gouttes (sphères) et les taches. */
function sangDans(lieu: string, portes: Record<string, boolean> = {}) {
  const scene = new THREE.Scene();
  const sang = new Sang(scene, (x, z) => hauteurSolLieu(lieu, x, z, portes));
  const groupe = scene.children[0]!;
  const gouttes = () => groupe.children.filter((m) => (m as THREE.Mesh).geometry.type === "SphereGeometry");
  const taches = () => groupe.children.filter((m) => (m as THREE.Mesh).geometry.type !== "SphereGeometry");
  return { sang, gouttes, taches };
}

test("au phare, le sang d'un coup sur la grève part de la hauteur de la grève, et ses taches s'y posent", () => {
  const greve = jeu(-20, 20);
  const sol = hauteurSolLieu("phare", greve.x, greve.z, {});
  assert.ok(sol < -8.5, `la grève : ${sol.toFixed(2)}`);
  const { sang, gouttes, taches } = sangDans("phare");
  sang.eclabousser(greve.x, greve.z, 1.25, 1);
  assert.ok(gouttes().length > 0);
  for (const g of gouttes()) assert.ok(Math.abs(g.position.y - (sol + 1.25)) < 1e-9, "la gerbe à 1,25 m au-dessus des galets");
  for (const t of taches()) assert.ok(Math.abs(t.position.y - (sol + 0.05)) < 0.011, "la tache sur les galets");
  // Les gouttes retombent sur les galets (pas à la hauteur du plateau) : elles y finissent toutes.
  for (let i = 0; i < 200; i++) sang.animer(1 / 60);
  assert.equal(gouttes().length, 0);
  for (const t of taches()) assert.ok(t.position.y < -8, "toutes les taches en bas");
});

test("au phare, sur le pont de l'épave échouée, le sang part du pont", () => {
  const pont = jeu(-5, 20);
  const sol = hauteurSolLieu("phare", pont.x, pont.z, { epave: true });
  assert.ok(Math.abs(sol + 4.1) < 0.3, `le pont : ${sol.toFixed(2)}`);
  const { sang, gouttes } = sangDans("phare", { epave: true });
  sang.eclabousser(pont.x, pont.z, 1.5, 2);
  for (const g of gouttes()) assert.ok(Math.abs(g.position.y - (sol + 1.5)) < 1e-9);
});

test("ailleurs, le sol est plat : le sang part d'où il partait (1,25 m), les taches à 4,5 cm", () => {
  for (const lieu of ["terrain", "corniche", "route_pont"]) {
    assert.equal(hauteurSolLieu(lieu, 3, -7, { epave: true }), 0);
    const { sang, gouttes, taches } = sangDans(lieu);
    sang.eclabousser(3, -7, 1.25, 1);
    for (const g of gouttes()) assert.equal(g.position.y, 1.25);
    for (const t of taches()) assert.ok(t.position.y >= 0.045 && t.position.y <= 0.055);
  }
  // Sans fonction de sol (l'ancien appel), pareil.
  const scene = new THREE.Scene();
  new Sang(scene).eclabousser(0, 0, 1.3, 0.8);
  assert.ok(scene.children[0]!.children.some((m) => m.position.y === 1.3));
});
