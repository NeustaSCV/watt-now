import { THREE } from '../../vendor/rendu-jeu.js';
import { civil, familial, cadrer, TENUES_ABONDANCE, PEAUX } from '../acteurs.js';
import { eclairage, sol } from '../decors.js';
const q = new URLSearchParams(location.search);
export const essai = {
  debut: 0, fin: 1000,
  creer() {
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9fb8c8);
    const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.05, 100);
    eclairage(scene, {}); sol(scene, 0x7fa35a, 20);
    const clip = q.get('clip') || 'Idle_Loop';
    const gens = [
      civil({ genre: 'homme', coiffure: 'simpleparted', peau: PEAUX[2], tenue: TENUES_ABONDANCE[2] }),
      civil({ genre: 'femme', coiffure: 'long', peau: PEAUX[4], tenue: TENUES_ABONDANCE[1] }),
      civil({ genre: 'homme', coiffure: 'buzzed', barbe: true, peau: PEAUX[0], tenue: TENUES_ABONDANCE[5] }),
      familial('voltaiques'), familial('mecanistes'),
    ];
    gens.forEach((g, i) => { g.objet.position.set((i - 2) * 0.9, 0, 0); scene.add(g.objet); g.jouer([{ clip, de: 0 }]); });
    return { scene, camera, maj(t) { gens.forEach((g) => g.maj(t)); cadrer(camera, [0, 1.3, 6], [0, 0.95, 0], 35); } };
  },
};
