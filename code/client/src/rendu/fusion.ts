// Moins d'appels de dessin, même image (2026-10-08) : dans un objet statique (une ressource du sol), les morceaux
// qui partagent un matériau sont fondus en un seul maillage. Un arbre fruitier passait de ≈ 100 maillages (un par
// fruit, par fleur, par feuille) à quelques-uns. Les sous-groupes qu'on montre ou cache (fruits mûrs, fleurs,
// contenu d'une épave fouillée) restent des groupes à part : on fond leurs morceaux à l'intérieur de chacun.

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** Ne garder que les attributs que toutes les géométries ont (position, normale, uv…), en non indexé. */
function harmoniser(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry[] {
  const plates = geometries.map((g) => (g.index ? g.toNonIndexed() : g));
  const communs = Object.keys(plates[0]!.attributes).filter((nom) => plates.every((g) => g.getAttribute(nom) !== undefined));
  return plates.map((g) => {
    for (const nom of Object.keys(g.attributes)) if (!communs.includes(nom)) g.deleteAttribute(nom);
    g.morphAttributes = {};
    return g;
  });
}

/**
 * Fond les maillages de `groupe` qui partagent un matériau (et la même ombre portée).
 * - Un sous-groupe ordinaire est aplati : ses maillages rejoignent ceux de `groupe` (avec leur position).
 * - Un sous-groupe marqué `userData.garder` reste à part (on le montre ou le cache) : on fond ses morceaux à
 *   l'intérieur.
 * - Un objet marqué `userData.intact` (pièce animée, morceaux montrés un par un) n'est pas touché.
 * Les maillages instanciés, animés par squelette ou à plusieurs matériaux restent tels quels.
 * Renvoie le nombre de maillages économisés.
 */
export function fusionnerStatique(groupe: THREE.Object3D): number {
  let economie = 0;
  groupe.updateMatrixWorld(true);
  const versGroupe = groupe.matrixWorld.clone().invert();
  const parCle = new Map<string, { maillages: THREE.Mesh[]; matrices: THREE.Matrix4[]; directs: boolean[] }>();
  const groupesAplatis: THREE.Object3D[] = [];

  const simple = (m: THREE.Mesh) =>
    m.isMesh && !(m as unknown as THREE.InstancedMesh).isInstancedMesh && !(m as unknown as THREE.SkinnedMesh).isSkinnedMesh && !Array.isArray(m.material) && !m.userData.intact && !m.userData.garder;
  const prendre = (m: THREE.Mesh, direct: boolean) => {
    const cle = `${(m.material as THREE.Material).uuid}|${m.castShadow}|${m.receiveShadow}`;
    const lot = parCle.get(cle) ?? { maillages: [], matrices: [], directs: [] };
    lot.maillages.push(m);
    lot.matrices.push(versGroupe.clone().multiply(m.matrixWorld));
    lot.directs.push(direct);
    parCle.set(cle, lot);
  };
  /** Un sous-groupe s'aplatit s'il ne contient que des maillages simples (et des groupes ordinaires) visibles. */
  const aplatissable = (o: THREE.Object3D): boolean =>
    !o.userData.intact && !o.userData.garder && o.visible && o.children.every((c) => ((c as THREE.Mesh).isMesh ? simple(c as THREE.Mesh) && c.visible && c.children.length === 0 : c.type === "Group" && aplatissable(c)));

  for (const enfant of [...groupe.children]) {
    const m = enfant as THREE.Mesh;
    if (enfant.userData.intact) continue;
    if (m.isMesh && simple(m) && m.children.length === 0 && m.visible) prendre(m, true);
    else if (enfant.type === "Group" && aplatissable(enfant)) {
      enfant.traverse((n) => {
        if ((n as THREE.Mesh).isMesh) prendre(n as THREE.Mesh, false);
      });
      groupesAplatis.push(enfant);
    } else if (enfant.children.length > 0) economie += fusionnerStatique(enfant);
  }
  for (const { maillages, matrices, directs } of parCle.values()) {
    // Un maillage direct, seul de son matériau : on le laisse tel quel.
    if (maillages.length === 1 && directs[0]) continue;
    const geometries = maillages.map((m, i) => m.geometry.clone().applyMatrix4(matrices[i]!));
    const fondue = maillages.length === 1 ? geometries[0]! : mergeGeometries(harmoniser(geometries), false);
    if (!fondue) {
      // Fusion impossible (attributs trop différents) : chaque morceau garde sa propre géométrie, à sa place.
      maillages.forEach((m, i) => {
        if (directs[i]) return;
        const seul = new THREE.Mesh(geometries[i]!, m.material);
        seul.castShadow = m.castShadow;
        seul.receiveShadow = m.receiveShadow;
        groupe.add(seul);
      });
      continue;
    }
    const modele = maillages[0]!;
    const unique = new THREE.Mesh(fondue, modele.material);
    unique.castShadow = modele.castShadow;
    unique.receiveShadow = modele.receiveShadow;
    groupe.add(unique);
    for (let i = 0; i < maillages.length; i++) if (directs[i]) groupe.remove(maillages[i]!);
    economie += maillages.length - 1;
  }
  for (const g of groupesAplatis) groupe.remove(g);
  return economie;
}
