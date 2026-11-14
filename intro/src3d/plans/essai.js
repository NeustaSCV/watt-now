import { THREE, FeuDeCamp } from '../../vendor/rendu-jeu.js';
import { familial, cadrer, cles } from '../acteurs.js';

export const essai = {
  debut: 0, fin: 1000,
  creer() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070a14);
    scene.fog = new THREE.FogExp2(0x070a14, 0.06);
    const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.05, 200);
    scene.add(new THREE.HemisphereLight(0x3a4a7a, 0x0a0806, 0.35));
    const lune = new THREE.DirectionalLight(0x8fa8ff, 0.5); lune.position.set(-5, 8, -6); scene.add(lune);
    const sol = new THREE.Mesh(new THREE.CircleGeometry(30, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x3a4a2e, roughness: 1 }));
    sol.receiveShadow = true; scene.add(sol);
    const feu = new FeuDeCamp({ id: 1, x: 0, z: 0, bois: 4, aspect: 'flammes' });
    scene.add(feu.objet);
    const lumiere = new THREE.PointLight(0xff8a3a, 30, 12, 2); lumiere.position.set(0, 0.6, 0); lumiere.castShadow = true; scene.add(lumiere);
    const nadia = familial('charbonniers');
    nadia.objet.position.set(0, 0, -1.1);
    scene.add(nadia.objet);
    nadia.jouer([{ clip: 'Crouch_Idle_Loop', de: 0 }]);
    return {
      scene, camera,
      maj(t, dt) {
        feu.animer(dt, 1);
        lumiere.intensity = 30 + Math.sin(t * 13) * 3 + Math.sin(t * 7.3) * 4;
        nadia.maj(t);
        cadrer(camera, cles([[0, [2.2, 1.0, 2.4]], [10, [1.4, 0.8, 1.9]]], t), [0, 0.55, -0.7], 40);
        return { bloom: 0.8, teinte: [1.05, 0.98, 0.92] };
      },
    };
  },
};
