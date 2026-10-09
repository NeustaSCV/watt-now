/* Watt Now? — intro 3D, acte I : « Abondance TV ». Un salon où tout est branché ; on entre dans la télé,
   on zappe ; on ressort voir celui qui regarde (le fauteuil le nourrit, sa montre lui rappelle de cligner des yeux) ;
   la réclame de Watty… et la coupure. Le temps T est celui de la cinématique (src/temps.js). */

import { THREE } from '../vendor/rendu-jeu.js';
import { cadrer, cles, epaule } from './acteurs.js';
import { salon } from './salon.js';
import { ecranIndicatif, ecranBienEtre, ecranReclame, ecranMontre, toile } from './textures.js';
import { teleachat, meteo, tendances, nature } from './programmes.js';
import { TELE_FIN, THEME, COUPURE, NAISSANCE } from '../src/temps.js';

const seg = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const doux = (k) => k * k * (3 - 2 * k);

const ECRAN_Z = -2.4 + 0.148 + 0.04;   // la surface de l'écran de la télé, dans le salon
const ECRAN_Y = 1.12;

/** L'écran qui s'allume : un trait blanc qui s'ouvre, puis l'image. */
function ecranAllumage(source) {
  return toile(1024, 768, (ctx, t, l, h) => {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, l, h);
    if (t < 0.15) return;
    const o = doux(seg(t, 0.15, 0.5));
    const hh = Math.max(4, h * o);
    ctx.save(); ctx.beginPath(); ctx.rect(0, (h - hh) / 2, l, hh); ctx.clip();
    source.maj(t);
    ctx.drawImage(source.canvas, 0, 0);
    ctx.fillStyle = `rgba(255,255,255,${1 - seg(t, 0.35, 0.8)})`; ctx.fillRect(0, 0, l, h);
    ctx.restore();
  });
}

/** Le salon, partagé par les plans de l'acte (on le reconstruit à chaque plan : c'est rapide). */
function scèneSalon(montre) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05060a);
  const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.03, 80);
  const s = salon({ montre });
  scene.add(s.groupe);
  return { scene, camera, s };
}

/* ---------------------------------------------------------------------- 1. L'allumage : on entre dans la télé */
const allumage = {
  debut: 0, fin: 2.75, preparer: 3,
  creer() {
    const { scene, camera, s } = scèneSalon();
    const ident = ecranIndicatif();
    const ecran = ecranAllumage(ident);
    return {
      scene, camera,
      maj(t) {
        ecran.maj(t);
        s.maj(t + 40, { ecran: ecran.texture, teleAllumee: t < 0.15 ? 0 : 1, couleurTele: 0xff9a80 });
        const k = doux(seg(t, 0.3, 2.75));
        // on passe par-dessus la tête du spectateur, puis on descend vers l'écran
        const pos = cles([[0, [0.12, 1.85, 3.6]], [1.3, [0.05, 1.82, 1.2]], [2.75, [0, ECRAN_Y, ECRAN_Z + 1.47]]], t);
        cadrer(camera, pos, [0, ECRAN_Y, ECRAN_Z], 30 + k * 15);
        return { noir: 1 - seg(t, 0.05, 0.45), bloom: 0.45 - k * 0.25, bloomSeuil: 0.85 + k * 0.1, vignette: 0.55, tube: k * 0.6, exposition: 1.0 - k * 0.15, grain: 0.05 };
      },
    };
  },
};

/** Un programme vu « dans le tube » : neige du zapping au début. */
function programme(debut, fin, fabrique) {
  return {
    debut, fin, preparer: 2,
    creer(m) {
      const p = fabrique(m);
      return {
        scene: p.scene, camera: p.camera,
        maj(t, dt, T, mo) {
          const g = p.maj(t, dt, T, mo) || {};
          return { ...g, neige: t < 0.22 ? 0.9 * (1 - t / 0.3) : 0 };
        },
      };
    },
  };
}

/* ---------------------------------------------------------------------- 5. On ressort : le spectateur, le fauteuil, la montre */
const spectateur = {
  debut: 21, fin: 27, preparer: 2,
  creer() {
    const tNotif = 24.32 - 21, tBravo = 25.67 - 21;
    const montre = ecranMontre(tNotif, tBravo);
    const { scene, camera, s } = scèneSalon(montre.texture);
    const bien = ecranBienEtre();
    return {
      scene, camera,
      maj(t) {
        bien.maj(t); montre.maj(t);
        s.maj(t + 3, { ecran: bien.texture, couleurTele: 0xffe2c0, montre: 1.3 });
        // la montre (au poignet gauche), là où la caméra viendra la voir
        const poignet = s.montre ? s.montre.position : s.spectateur.ou('hand_l');
        const tete = s.spectateur.ou('Head');
        // la caméra : de l'écran, on recule, on tourne autour du fauteuil, on plonge sur la montre ; puis retour à la télé
        const pos = cles([
          [0, [0, ECRAN_Y, ECRAN_Z + 1.47]],
          [1.6, [1.2, 1.35, 0.1]],
          [2.7, [0.95, 1.55, 0.35]],
          [3.25, [poignet.x - 0.08, poignet.y + 0.36, poignet.z - 0.2]],
          [5.0, [poignet.x - 0.06, poignet.y + 0.3, poignet.z - 0.16]],
          [5.45, [0.4, 1.3, 0.2]],
          [6.0, [0, ECRAN_Y, ECRAN_Z + 1.3]],
        ], t);
        const vise = cles([
          [0, [0, ECRAN_Y, ECRAN_Z]],
          [1.6, [0, 1.05, 1.25]],
          [2.7, [tete.x, tete.y - 0.15, tete.z]],
          [3.25, [poignet.x, poignet.y, poignet.z]],
          [5.0, [poignet.x, poignet.y, poignet.z]],
          [5.45, [0, ECRAN_Y, ECRAN_Z]],
          [6.0, [0, ECRAN_Y, ECRAN_Z]],
        ], t);
        const focale = cles([[0, 45], [1.6, 30], [2.7, 40], [3.25, 50], [5.0, 58], [5.45, 30], [6.0, 45]], t);
        const sh = epaule(t, 0.6);
        cadrer(camera, [pos[0] + sh[0], pos[1] + sh[1], pos[2] + sh[2]], vise, focale);
        // en gros plan, la caméra se met dans l'axe de la montre (le texte se lit droit)
        const gros = doux(seg(t, 2.8, 3.3)) * (1 - doux(seg(t, 5.0, 5.35)));
        if (gros > 0 && s.montre) {
          const axe = new THREE.Vector3(0, 0, 1).applyQuaternion(s.montre.quaternion);
          camera.up.set(0, 1, 0).lerp(axe, gros).normalize();
          camera.lookAt(...vise);
        }
        return { bloom: 0.5, vignette: 0.5, tube: t < 0.5 ? 0.6 * (1 - t / 0.5) : t > 5.5 ? (t - 5.5) * 1.2 : 0, exposition: 1.05, grain: 0.05, teinte: [1.0, 1.0, 1.04], nette: camera.position.distanceTo(new THREE.Vector3(...vise)), ouverture: gros > 0 ? 0.006 : 0.0015 };
      },
    };
  },
};

/* ---------------------------------------------------------------------- 7. La réclame de Watty, la coupure, le noir */
const coupure = {
  debut: TELE_FIN, fin: NAISSANCE - 1.2, preparer: 2,
  creer() {
    const tc = COUPURE - THEME;
    const reclame = ecranReclame(tc);
    const { scene, camera, s } = scèneSalon();
    let figeBras = null;
    return {
      scene, camera,
      maj(t) {
        reclame.maj(t);
        const apres = t - tc;
        // à la coupure : un hoquet (tout clignote 0,15 s), puis plus rien
        const eteint = apres < 0 ? 0 : apres < 0.15 ? (Math.sin(apres * 120) > 0 ? 0.2 : 0.9) : 1;
        const tele = apres < 0.8 ? 1 : Math.max(0, 1 - seg(apres, 0.8, 1.9));
        if (apres >= 0 && figeBras === null) figeBras = ((tc + 3) * 0.42) % 1;
        const tete = seg(apres, 2.2, 4.6);
        s.maj(t + 6, {
          ecran: reclame.texture, teleAllumee: tele, couleurTele: apres < 0 ? 0xffe0b0 : 0xffffff,
          eteint, brasFige: apres >= 0 ? figeBras : undefined, robotFige: apres >= 0 ? tc + 6 : undefined,
          teteVersFenetre: doux(tete),
        });
        // la caméra : par-dessus l'épaule, on s'approche ; après la coupure, on glisse vers son visage, puis vers la fenêtre
        const pos = cles([[0, [0.95, 1.5, 2.4]], [tc, [0.55, 1.38, 1.6]], [tc + 2, [0.8, 1.42, 2.15]], [tc + 5.5, [0.2, 1.4, 0.0]], [tc + 7.5, [-1.6, 1.5, -0.4]], [tc + 10, [-2.6, 1.6, -0.55]]], t);
        const vise = cles([[0, [0, 1.05, -2.3]], [tc, [0, 1.1, -2.3]], [tc + 2, [0, 1.15, -2.0]], [tc + 5.5, [0, 1.3, 1.2]], [tc + 7.5, [-3.4, 1.6, -0.6]], [tc + 10, [-3.5, 1.6, -0.6]]], t);
        const focale = cles([[0, 36], [tc, 42], [tc + 2, 40], [tc + 5.5, 45], [tc + 7.5, 30], [tc + 10, 26]], t);
        cadrer(camera, pos, vise, focale);
        const nuit = seg(apres, 0, 0.4);
        return {
          bloom: 0.35 + (apres > 0 && apres < 1.8 ? 0.35 : 0), bloomSeuil: 0.9, vignette: 0.5 + nuit * 0.15, exposition: 1 + nuit * 0.25,
          teinte: [1 - nuit * 0.12, 1 - nuit * 0.04, 1 + nuit * 0.12], grain: 0.05 + nuit * 0.03,
          noir: seg(t, tc + 9.5, tc + 10.25) * 0.7,
        };
      },
    };
  },
};

export const PLANS_ACTE1 = [
  allumage,
  programme(2.75, 8.75, teleachat),
  programme(8.75, 15, meteo),
  programme(15, 21, tendances),
  spectateur,
  programme(27, TELE_FIN, nature),
  coupure,
];

/** Ce que disent les présentateurs (cartons « télé »), puis le récit. */
export const CARTONS_ACTE1 = [
  [3.4, 5.9, 'Souffler sur sa soupe, c\'est tellement 2010.', 'tele'],
  [6.0, 8.6, 'Souffle-Soupe 3000 : 900 watts de puissance pour vos poumons fatigués.', 'tele'],
  [9.2, 11.8, 'Demain, grand soleil. Un phénomène naturel, ne vous inquiétez pas.', 'tele'],
  [12.1, 14.9, '…profitez-en pour sécher votre linge. À 90 degrés.', 'tele'],
  [15.4, 17.9, 'Trois marches, c\'est trois de trop.', 'tele'],
  [18.2, 20.9, 'Votre chien fait ses 10 000 pas. Vous, non. Tout le monde est content.', 'tele'],
  [21.4, 23.6, 'Respirez. Pour le reste, il y a l\'abonnement Premium.', 'tele'],
  [27.3, 29.9, 'Il pleut ? Votre arrosage connecté, lui, ne regarde pas dehors.', 'tele'],
  [30.2, 32.9, 'Livrée en 12 minutes depuis l\'entrepôt. Le pommier, lui, attendait depuis 40 ans.', 'tele'],
  [33.6, 37.8, 'Pourquoi réfléchir quand on peut brancher ?', 'pub'],
];
