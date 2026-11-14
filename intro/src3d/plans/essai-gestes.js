import { THREE } from '../../vendor/rendu-jeu.js';
import { familial, cadrer } from '../acteurs.js';
import { eclairage, sol } from '../decors.js';
// labo.html?plan=essai-gestes&t=1&clips=A,B,C&k=0.5 : une rangée de personnages, chacun à la fraction k de son geste
const p = new URLSearchParams(location.search);
let clips = (p.get('clips') || 'Idle_Loop').split(',');
if (clips.length === 1 && p.get('k')?.includes(',')) clips = p.get('k').split(',').map(() => clips[0]);
const ks = (p.get('k') || '0.5').split(',').map(Number);
const kde = (i) => ks[Math.min(i, ks.length - 1)];
export const essai = {
  debut: 0, fin: 1000,
  creer() {
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9fb8c8);
    const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.05, 100);
    eclairage(scene, {}); sol(scene, 0x7fa35a, 30);
    const n = clips.length;
    const gens = clips.map((c, i) => { const g = familial(p.get('famille') || 'mecanistes'); g.objet.position.set((i - (n - 1) / 2) * 1.3, 0, 0); g.objet.rotation.y = Number(p.get('rot') || 0.6); scene.add(g.objet); g.jouer([{ clip: c, de: 0, vitesse: 0, depuis: 0 }]); g.noterRepos(); return g; });
    return { scene, camera, maj(t) { gens.forEach((g, i) => { const a = g.actions.get(clips[i]); const d = a ? a.getClip().duration : 1; g.piste[0].fige = d * kde(i); g.maj(t); }); cadrer(camera, [0, 1.4, 2 + n * 1.4], [0, 0.8, 0], 30); } };
  },
};
