import { THREE } from '../../vendor/rendu-jeu.js';
import { civil, cadrer, TENUES_ABONDANCE } from '../acteurs.js';
import { eclairage, sol } from '../decors.js';
const q = new URLSearchParams(location.search);
const os = q.get('os') || 'upperarm_r';
export const essai = {
  debut: 0, fin: 1000,
  creer() {
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9fb8c8);
    const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.05, 100);
    eclairage(scene, {}); sol(scene, 0x7fa35a, 20);
    const axes = [[0, 0, 0], [60, 0, 0], [-60, 0, 0], [0, 60, 0], [0, -60, 0], [0, 0, 60], [0, 0, -60]];
    const gens = axes.map((a, i) => { const g = civil({ tenue: TENUES_ABONDANCE[i % 7] }); g.objet.position.set((i - 3) * 0.85, 0, 0); scene.add(g.objet); g.jouer([{ clip: 'Idle_Loop', de: 0, fige: 0 }]); g.retoucher((t, a2) => a2.tourner(os, ...a)); return g; });
    return { scene, camera, maj(t) { gens.forEach((g) => g.maj(t)); cadrer(camera, [0, 1.2, 7.5], [0, 1.0, 0], 30); } };
  },
};
