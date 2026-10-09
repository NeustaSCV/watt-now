/* Watt Now? — intro 3D : les objets du Survival Kit de Kenney (CC0, assets/kenney/, licence jointe).
   Outils (marteau, pioche, houe, pelle, hache), enclume, établi, seau, tonneaux, caisses…
   Chargés une fois pendant l'écran de chargement, puis clonés à la demande. */

import { THREE, GLTFLoader } from '../vendor/rendu-jeu.js';

const modeles = new Map();
/** L'adresse du dossier intro/ tel qu'il est servi (« / » en mise au point, « /intro/ » dans le jeu). */
let base = '/';
export function definirBase(b) { base = (b || '/').replace(/\/?$/, '/'); }
export const adresse = (chemin) => base + chemin;
const NOMS = ['tool-hammer', 'tool-hammer-upgraded', 'tool-hoe', 'tool-shovel', 'tool-axe', 'tool-pickaxe', 'workbench-anvil', 'workbench',
  'workbench-grind', 'bucket', 'barrel', 'barrel-open', 'box', 'box-large', 'resource-wood', 'resource-planks', 'bottle', 'chest', 'tree-log-small'];

export async function chargerKenney() {
  if (modeles.size) return;
  const loader = new GLTFLoader();
  await Promise.all(NOMS.map(async (n) => {
    const g = await loader.loadAsync(adresse(`assets/kenney/${n}.glb`)).catch(() => null);
    if (!g) return;
    g.scene.traverse((m) => {
      if (!m.isMesh) return;
      m.castShadow = m.receiveShadow = true;
      const mat = m.material;
      if (mat.map) { mat.map.colorSpace = THREE.SRGBColorSpace; mat.map.anisotropy = 8; }
      mat.roughness = 0.75; mat.metalness = 0;
    });
    modeles.set(n, g.scene);
  }));
}

/** Un objet Kenney, à l'échelle voulue (`taille` : sa plus grande dimension, en mètres), base posée sur 0. */
export function kenney(nom, taille = null, o = {}) {
  const m = modeles.get(nom);
  const g = new THREE.Group();
  if (!m) return g;
  const c = m.clone(true);
  c.traverse((n) => { if (n.isMesh && o.couleur) { n.material = n.material.clone(); n.material.color.set(o.couleur); } if (n.isMesh && o.metal !== undefined) { n.material = n.material.clone(); n.material.metalness = o.metal; n.material.roughness = o.rugueux ?? 0.45; } });
  const boite = new THREE.Box3().setFromObject(c);
  const t = boite.getSize(new THREE.Vector3());
  const e = taille ? taille / Math.max(t.x, t.y, t.z) : 1;
  c.scale.setScalar(e);
  c.position.set(-(boite.min.x + boite.max.x) / 2 * e, -boite.min.y * e, -(boite.min.z + boite.max.z) / 2 * e);
  g.add(c);
  return g;
}
