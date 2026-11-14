/* Watt Now? — making-of : le film. Un seul plan, continu : le personnage avance vers +x, la caméra le suit de
   trois-quarts face, à hauteur d'homme ; il reste au centre de l'image, c'est le monde qui défile et qui change.
   À la fin, sur la plage des Flots, il s'arrête, se tourne vers la mer, et la caméra recule et monte : l'hôtel
   apparaît derrière lui, puis le logo. */

import { THREE } from '../vendor/rendu-jeu.js';
import { pret, cadrer, cles, epaule } from '../intro-copie/acteurs.js';
import { logo } from '../intro-copie/dessins.js';
import { DERNIERE, MESURE, FIN, T, ARRET, LOGO, PARCOURS, distance } from './temps.js';
import { Eres } from './eres.js';
import { creerPersonnages } from './personnages.js';
import { creerCreatures } from './creatures.js';
import { creerDecor, chargerDecor } from './decor.js';

/** Où il s'arrête : sur la plage des Flots, au bord de l'eau, à gauche du parasol couché (le lot de l'hôtel est calé
 *  sur le chemin dans decor.js ; x comme dans le lot : la façade de -29 à 17, son milieu vers -6). */
export const XF = -11, ZP = 17.5;
const X0 = XF - PARCOURS;

const doux = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));

let image = null;
export async function chargerTout() {
  await Promise.all([pret({ gestes: false }), chargerDecor(), new Promise((ok) => {
    const i = new Image();
    i.onload = () => { image = i; ok(); };
    i.onerror = () => ok();
    i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 108" width="1200" height="432">${logo()}</svg>`);
  })]);
}

/** L'époque « globale » (ciel, lumière) : celle de la dernière vague passée sous lui, fondue sur 0,6 s. */
function ereGlobale(t) {
  const j = Math.max(0, Math.min(DERNIERE, Math.floor(t / MESURE)));
  return j === 0 ? 0 : j - 1 + doux((t - T(j)) / 0.6);
}

export const plan = {
  debut: 0, fin: FIN + 1, preparer: 0,
  creer(moteur) {
    moteur.rendu.localClippingEnabled = true;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.1, 1500);
    const eres = new Eres(X0);
    const decor = creerDecor(scene, eres, X0, XF, ZP);
    const creatures = creerCreatures(scene, eres, X0, ZP);
    // le personnage : une version par époque, la dernière jusqu'au bout
    const versions = creerPersonnages();
    const sx = (t) => X0 + distance(t);
    let xActuel = X0;
    versions.forEach((v, e) => {
      scene.add(v.objet);
      v.objet.traverse((n) => { if (n.isMesh) n.castShadow = n.receiveShadow = true; });
      eres.ranger(v.objet, e, e === versions.length - 1 ? DERNIERE : e, { x: () => xActuel, marge: 0.7 });
    });

    return {
      scene, camera,
      maj(t, dt) {
        const x = sx(t);
        xActuel = x;
        creatures.placer(t, x);
        eres.maj(t);
        // il se tourne vers la mer (et la caméra) une fois arrêté
        const tourne = doux((t - ARRET + 0.25) / 1.1);
        for (const v of versions) {
          v.objet.position.set(x, 0, ZP);
          v.objet.rotation.y = Math.PI / 2 - tourne * 1.25;
          if (v.objet.visible) v.maj(t);
        }
        creatures.animer(t, dt);
        decor.animer(t, dt, x);

        // la caméra : de trois-quarts face, à hauteur d'homme ; puis le grand recul sur la plage
        const recul = doux((t - (ARRET - 0.6)) / (FIN - ARRET - 0.2));
        const e = epaule(t, 0.7 * (1 - recul));
        const proche = { pos: [x + 2.6, 1.65, ZP + 7.6], vise: [x + 0.05, 1.0, ZP] };
        const loin = { pos: [-5, 3.4, ZP + 17], vise: [-7, 7.2, -6] };
        const k = recul;
        const pos = proche.pos.map((v, i) => v + (loin.pos[i] - v) * k + e[i]);
        const vise = proche.vise.map((v, i) => v + (loin.vise[i] - v) * Math.pow(k, 0.8));
        cadrer(camera, pos, vise, cles([[0, 30], [1, 24]], k));
        // la lumière et l'étalonnage de l'époque
        const g = decor.eclairer(ereGlobale(t), x, k);
        // un éclair au passage de chaque vague, sur le premier temps
        let eclair = 0;
        for (let j = 1; j <= DERNIERE; j++) { const u = t - T(j); if (u > -0.05 && u < 0.4) eclair = Math.max(eclair, 0.16 * Math.exp(-Math.max(0, u) * 9)); }
        const noir = Math.max(0, Math.min(1, (t - (FIN - 0.9)) / 0.9));
        return { ...g, blanc: eclair, noir };
      },
    };
  },
};

/** Le logo, à la fin, par-dessus l'image (calque 2D du moteur). */
export function dessinerLogo(ctx, T0, l, h) {
  const u = T0 - LOGO;
  if (u < 0 || !image) return false;
  const seg = (a, b) => Math.min(1, Math.max(0, (u - a) / (b - a)));
  const rebond = (k) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
  const k = rebond(seg(0, 0.7));
  ctx.save();
  ctx.translate(l / 2, h * 0.15);
  ctx.rotate((1 - seg(0, 0.7)) * -0.18);
  ctx.scale(Math.max(0.001, k), Math.max(0.001, k));
  const lw = l * 0.34, lh = lw * 0.36;
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
  ctx.drawImage(image, -lw / 2, -lh / 2, lw, lh);
  ctx.restore();
  return true;
}

export { FIN };
