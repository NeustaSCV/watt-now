import { THREE } from '../../vendor/rendu-jeu.js';
import { cadrer } from '../acteurs.js';
import { salon } from '../salon.js';
import { ecranIndicatif, ecranMontre } from '../textures.js';

const vues = {
  a: [[0, 1.6, 3.6], [0, 1.0, -1.5], 28],
  b: [[1.8, 1.3, 2.4], [0, 0.95, 1.2], 35],
  c: [[-2.6, 1.4, 0.4], [0.3, 0.9, 1.0], 30],
  d: [[0.5, 1.25, 0.1], [0, 1.15, 1.3], 35],
};
export const essai = {
  debut: 0, fin: 1000,
  creer() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.05, 100);
    const ind = ecranIndicatif(); const mo = ecranMontre(1, 3);
    const s = salon({ montre: mo.texture });
    scene.add(s.groupe);
    const q = new URLSearchParams(location.search);
    const vue = q.has('cam') ? [q.get('cam').split(',').map(Number), q.get('vise').split(',').map(Number), Number(q.get('f') || 35)] : vues[q.get('vue') || 'a'];
    return { scene, camera, maj(t) { ind.maj(t); mo.maj(t); s.maj(t, { ecran: ind.texture }); cadrer(camera, ...vue); return { bloom: 0.5 }; } };
  },
};
