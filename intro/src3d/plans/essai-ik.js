import { THREE } from '../../vendor/rendu-jeu.js';
import { civil, cadrer, TENUES_ABONDANCE } from '../acteurs.js';
import { eclairage, sol, boule } from '../decors.js';
export const essai = {
  debut: 0, fin: 1000,
  creer() {
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9fb8c8);
    const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.05, 100);
    eclairage(scene, {}); sol(scene, 0x7fa35a, 20);
    const cibles = [[-1.6, 2.2, 0.3], [0.2, 1.3, 0.6], [1.9, 1.0, 0.5]];
    cibles.forEach((c) => boule(scene, 0.04, new THREE.MeshBasicMaterial({ color: 0xff0000 }), ...c));
    const gens = [0, 1, 2].map((i) => { const g = civil({ tenue: TENUES_ABONDANCE[i] }); g.objet.position.set((i - 1) * 1.6, 0, 0); scene.add(g.objet); g.jouer([{ clip: 'Idle_Loop', de: 0 }]); g.noterRepos(); return g; });
    gens[0].retoucher((t, a) => a.atteindre('r', cibles[0], [-2.5, 1.0, -1]));
    gens[1].retoucher((t, a) => { a.atteindre('l', cibles[1], [1, 0.5, -1]); a.regarder([0, 1.2, 8]); });
    gens[2].retoucher((t, a) => { a.atteindre('r', cibles[2], [1.5, 0.5, -1]); a.regarder(cibles[2]); });
    return { scene, camera, maj(t) { gens.forEach((g) => g.maj(t)); cadrer(camera, [1, 1.6, 6.5], [0, 1.1, 0], 30); } };
  },
};
