/* Watt Now? — intro 3D : le lecteur. Il charge tout (personnages, images, musique), joue la cinématique calée sur
   le son, affiche les cartons (dans l'image, ou sous l'image sur un téléphone tenu droit), le bouton « Passer »,
   puis le titre et « Continuer ». Le même montage sert à l'export vidéo (capture.html). */

import { Moteur } from './moteur.js';
import { pret } from './acteurs.js';
import { prechargerImages } from './textures.js';
import { dessinerCarton } from './cartons.js';
import { PLANS_ACTE1, CARTONS_ACTE1 } from './acte1.js';
import { PLANS_ACTE2, CARTONS_ACTE2 } from './acte2.js';
import { PLANS_ACTE3, CARTONS_ACTE3 } from './acte3.js';
import { plansActe4, cartonsActe4, dessinerTitre } from './acte4.js';
import { ZAPPINGS } from '../src/plans-tele.js';
import { TITRE, ACCUEIL } from '../src/temps.js';
import { plansAccueil } from './accueil.js';

export const FAMILLES = ['charbonniers', 'voltaiques', 'mecanistes'];

/** Le montage complet : les plans et les cartons, pour une famille (et l'apparence du joueur, si on l'a). */
export function montage(famille, apparence) {
  const f = FAMILLES.includes(famille) ? famille : 'charbonniers';
  const cartons = [...CARTONS_ACTE1, ...CARTONS_ACTE2, ...CARTONS_ACTE3, ...cartonsActe4(f)].sort((a, b) => a[0] - b[0]);
  const accueil = plansAccueil(f, apparence, ACCUEIL);   // les écrans d'accueil, après la cinématique (ecrans.js)
  return {
    plans: [...PLANS_ACTE1, ...PLANS_ACTE2, ...PLANS_ACTE3, ...plansActe4(f, apparence), ...accueil],
    accueil,
    cartons,
    radios: cartons.filter((c) => c[3] === 'radio').map((c) => c[0]),
    zappings: ZAPPINGS,
  };
}

/** Charge tout ce qu'il faut avant de jouer (personnages et images). */
export async function chargerTout() {
  await Promise.all([pret(), prechargerImages()]);
}

/**
 * Monte la cinématique 3D dans `racine` (un élément plein écran). Renvoie le moteur et l'interface.
 * o : { famille, apparence, surPasser, cartonsDansImage ('auto' | true | false), qualite, accueilSeul }
 */
export function monterCinematique3D(racine, o = {}) {
  // o.accueilSeul : seulement les trois écrans d'accueil (le jeu n'intègre pas la cinématique)
  const m = montage(o.famille, o.apparence);
  const { accueil } = m;
  const plans = o.accueilSeul ? accueil : m.plans, cartons = o.accueilSeul ? [] : m.cartons;
  racine.insertAdjacentHTML('beforeend', `
    <div class="wi-cinema">
      <div class="wi-cadre"><canvas class="wi-toile" aria-label="Cinématique d'introduction"></canvas></div>
      <div class="wi-cartons wi-cartons-dessous" aria-live="polite"></div>
      <button type="button" class="wi-passer">Passer <span aria-hidden="true">›</span></button>
    </div>`);
  const cinema = racine.lastElementChild;
  const cadre = cinema.querySelector('.wi-cadre');
  const canvas = cinema.querySelector('canvas');
  const dessous = cinema.querySelector('.wi-cartons-dessous');
  const mobile = matchMedia('(pointer: coarse)').matches;
  const moteur = new Moteur(canvas, {
    plans, cartons, capture: !!o.capture, qualite: o.qualite,
    pixels: o.pixels || Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2),
    dessinerCarton: null,
    surCalque: (ctx, T, l, h) => T < ACCUEIL && dessinerTitre(ctx, T, l, h),
  });
  // les cartons : dans l'image si elle est assez grande pour qu'on les lise, sinon en texte sous l'image
  let dedans = true;
  function ajuster() {
    const r = cadre.getBoundingClientRect();
    moteur.taille(Math.max(320, Math.round(r.width)), Math.max(180, Math.round(r.height)));
    dedans = o.cartonsDansImage === true || (o.cartonsDansImage !== false && r.height >= 380);
    moteur.dessinerCarton = dedans ? dessinerCarton : null;
    dessous.style.display = dedans ? 'none' : 'block';
  }
  ajuster();
  const surTaille = () => ajuster();
  window.addEventListener('resize', surTaille);
  cinema.querySelector('.wi-passer').addEventListener('click', () => o.surPasser && o.surPasser());

  let courant = null;
  return {
    moteur, cinema, cadre, accueil,
    /** Construit tous les plans d'avance (à attendre avant de lancer le son). */
    prechauffer: (surAvance) => moteur.toutMonter(surAvance),
    image(T, dt) {
      moteur.image(T, dt);
      if (!dedans) {
        const c = cartons.find(([a, b]) => T >= a && T < b) || null;
        if (c !== courant) {
          courant = c;
          dessous.innerHTML = c ? `<p class="wi-carton wi-${c[3]}">${c[4] || c[2]}</p>` : '';
        }
        if (c) dessous.style.opacity = Math.min(1, (T - c[0]) / 0.35, (c[1] - T) / 0.35).toFixed(3);
      }
    },
    cacherPasser() { cinema.querySelector('.wi-passer').hidden = true; },
    detruire() { window.removeEventListener('resize', surTaille); moteur.detruire(); cinema.remove(); },
  };
}

export { TITRE };
