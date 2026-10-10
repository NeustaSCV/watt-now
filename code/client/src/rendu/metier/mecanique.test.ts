// ⚙️ Les modèles des Mécanistes (chantier 7 · 0.6) : chacun se construit, reste dans un budget de triangles raisonnable
// (Book 21 §5.3.4), et les pièges ont bien leurs deux visages (armé, déclenché).

import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { modeleMetier } from "./index.ts";
import { modelesMecanique } from "./mecanique.ts";

function triangles(o: THREE.Object3D): number {
  let n = 0;
  o.traverse((m) => {
    const g = (m as THREE.Mesh).geometry;
    if (!(m as THREE.Mesh).isMesh || !g) return;
    n += (g.index ? g.index.count : g.getAttribute("position").count) / 3;
  });
  return n;
}

test("⚙️ modèles : chaque modèle des Mécanistes est enregistré, se construit, et tient sous 3 000 triangles", () => {
  for (const [objet, usage] of modelesMecanique()) {
    const m = modeleMetier(objet, usage);
    assert.ok(m, `${usage}:${objet} enregistré`);
    const t = triangles(m);
    assert.ok(t > 20 && t < 3000, `${objet} : ${t} triangles`);
    // Deux appels donnent deux objets distincts (on les place et on les anime seuls).
    assert.notEqual(modeleMetier(objet, usage), m);
  }
});

test("⚙️ modèles : un piège a un visage armé et un visage déclenché ; un accessoire du pédalier dit quel état le montre", () => {
  for (const type of ["assommoir", "machoires_fortune", "piege_machoires", "fosse_pieux"]) {
    const m = modeleMetier(type, "sol")!;
    const faces: boolean[] = [];
    m.traverse((o) => {
      if (typeof o.userData.siArme === "boolean") faces.push(o.userData.siArme);
    });
    assert.deepEqual(faces.sort(), [false, true], type);
  }
  assert.equal(modeleMetier("pedalier_soufflet", "sol")!.userData.siEtat, "soufflet");
  assert.equal(modeleMetier("pedalier_meule_fine", "sol")!.userData.siEtat, "meuleFine");
});

// ---------- Les meubles de famille (plan 0.8, chantier 7) ----------

test("⚙️ le pédalier générateur : l'alternateur se montre monté, ses poulies tournent ; la batterie posée se voit", () => {
  const alt = modeleMetier("pedalier_alternateur", "sol")!;
  assert.equal(alt.userData.siEtat, "alternateur");
  const tournantes: THREE.Object3D[] = [];
  alt.traverse((o) => {
    if (typeof o.userData.animer === "function") tournantes.push(o);
  });
  assert.equal(tournantes.length, 2, "la grande poulie et celle de l'alternateur");
  const [grande, petite] = tournantes as [THREE.Object3D, THREE.Object3D];
  grande.userData.animer(0.1, false);
  assert.equal(grande.rotation.z, 0, "à l'arrêt, rien ne tourne");
  grande.userData.animer(0.1, true);
  petite.userData.animer(0.1, true);
  assert.ok(Math.abs(petite.rotation.z) > Math.abs(grande.rotation.z) * 2, "la petite poulie tourne plus vite");
  const bat = modeleMetier("pedalier_batterie", "sol")!;
  bat.userData.majEtat({});
  const visibles = () => bat.children.filter((o) => o.visible).length;
  assert.equal(visibles(), 0, "sans batterie posée, rien");
  bat.userData.majEtat({ batteries: { batterie_voiture: 1 } });
  assert.equal(visibles(), 2, "la batterie de la ruine et ses câbles");
});

test("⚡ le banc solaire : le panneau se montre posé ; la jauge suit la charge des batteries du banc", async () => {
  await import("./electricite.ts");
  const p = modeleMetier("banc_panneau", "sol")!;
  assert.equal(p.userData.siEtat, "panneau");
  assert.ok(triangles(p) < 3000, `${triangles(p)} triangles`);
  let jauge: THREE.Object3D | null = null;
  p.traverse((o) => {
    if (typeof o.userData.majEtat === "function") jauge = o;
  });
  assert.ok(jauge, "la barre de la jauge");
  const j = jauge as unknown as THREE.Mesh;
  j.userData.majEtat({ batteries: { batterie_voiture: 1 }, charges: { batterie_voiture: 360 } });
  assert.equal(j.scale.x, 1);
  j.userData.majEtat({ batteries: { batterie_voiture: 1 }, charges: { batterie_voiture: 90 } });
  assert.equal(j.scale.x, 0.25);
  j.userData.majEtat({});
  assert.equal(j.visible, false, "sans batterie, la jauge est éteinte");
});

test("🔥 le foyer de forge : la pierre plate cède la place à l'enclume de dépanneur ; l'auge de glaise se montre posée", async () => {
  const { accessoiresForge, majAccessoiresForge } = await import("./forge.ts");
  const a = accessoiresForge();
  majAccessoiresForge(a, {});
  assert.ok(a.pierrePlate.visible && !a.enclumes.depanneur.visible && !a.bac.visible);
  majAccessoiresForge(a, { enclume: "depanneur", bac: true });
  assert.ok(!a.pierrePlate.visible && a.enclumes.depanneur.visible && a.bac.visible);
  majAccessoiresForge(a, { enclume: "etau" });
  assert.ok(a.pierrePlate.visible && a.enclumes.etau.visible, "l'étau a son propre billot");
  for (const o of [a.pierrePlate, a.enclumes.depanneur, a.bac]) assert.ok(triangles(o) < 3000, `${o.name} : ${triangles(o)} triangles`);
});
