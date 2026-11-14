import { THREE } from '../../vendor/rendu-jeu.js';
import { civil, cadrer, TENUES_ABONDANCE } from '../acteurs.js';
import { eclairage, sol } from '../decors.js';
import { kenney } from '../kenney.js';
// labo.html?plan=essai-mains&t=1 : trois mains (ouverte, poing, prise ronde) ; ?sens=-1 pour inverser
const sens = Number(new URLSearchParams(location.search).get('sens') || 1);
const vue = new URLSearchParams(location.search).get('vue') || 'mains';
export const essai = {
  debut: 0, fin: 1000,
  creer() {
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9fb8c8);
    const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.05, 100);
    eclairage(scene, {}); sol(scene, 0x7fa35a, 20);
    const gens = [0, 1, 2].map((i) => { const g = civil({ tenue: TENUES_ABONDANCE[i] }); g.objet.position.set((i - 1) * 0.9, 0, 0); scene.add(g.objet); g.jouer([{ clip: ['Idle_Loop', 'Idle_TalkingPhone_Loop', 'Sitting_Talking_Loop'][i], de: 0 }]); g.noterRepos(); g.sensDoigts = sens; return g; });
    gens[0].retoucher((t, a) => { a.serrer('r', 1); a.serrer('l', 1, { rond: 1 }); });
    gens[1].retoucher((t, a) => a.serrer('r', 0.8, { rond: 0.6 }));
    const enclume = kenney('workbench-anvil', 0.7); enclume.position.set(2, 0, 0); scene.add(enclume);
    const marteau = kenney('tool-hammer', 0.4); marteau.position.set(2.6, 0, 0.3); scene.add(marteau);
    return { scene, camera, maj(t) { gens.forEach((g) => g.maj(t)); if (vue === 'mains') cadrer(camera, [-0.6, 1.1, 1.4], [-0.9, 0.95, 0], 50); else cadrer(camera, [0.6, 1.5, 5.5], [0.6, 0.9, 0], 30); } };
  },
};
