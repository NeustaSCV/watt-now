/* Watt Now? — intro : la version dessinée (2D, SVG) de la cinématique, en secours quand le WebGL manque.
   Même histoire, mêmes cartons, même son ; l'interface est celle du lecteur 3D (image, cadre, cacherPasser, detruire). */

import { monterCinematique } from './cinematique.js';
import { PLANS_TELE, CARTONS_TELE, ZAPPINGS } from './plans-tele.js';
import { PLANS_PANNE, CARTONS_PANNE } from './plans-panne.js';
import { PLANS_FAMILLES, CARTONS_FAMILLES } from './plans-familles.js';
import { plansFin, cartonsFin } from './plans-fin.js';

export function radios() {
  return CARTONS_PANNE.filter((c) => c[3] === 'radio').map((c) => c[0]);
}

export function monter(racine, famille, surPasser) {
  const cine = monterCinematique(racine, {
    plans: [...PLANS_TELE, ...PLANS_PANNE, ...PLANS_FAMILLES, ...plansFin(famille)],
    cartons: [...CARTONS_TELE, ...CARTONS_PANNE, ...CARTONS_FAMILLES, ...cartonsFin(famille)],
    zappings: ZAPPINGS,
    surPasser,
  });
  return {
    cadre: cine.racine.querySelector('.wi-cadre'),
    image: (T) => cine.aller(T),
    cacherPasser: cine.cacherPasser,
    detruire: cine.detruire,
  };
}
