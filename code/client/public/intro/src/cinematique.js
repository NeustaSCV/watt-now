/* Watt Now? — intro : le lecteur de la cinématique.
   Tout est piloté par une seule horloge (le temps T en secondes, donné par le son) : à chaque image,
   on monte les plans actifs, on démonte les autres, on affiche le bon carton. Une image ne dépend que de T :
   on peut donc se placer à n'importe quel instant (mise au point, captures, export vidéo). */

import { DEFS } from './dessins.js';
import { NS, echappe } from './outils.js';
import { COUPURE } from './temps.js';

const STYLES_CARTONS = new Set(['tele', 'pub', 'radio', 'recit', 'devise', 'toi']);

export function monterCinematique(conteneur, { plans, cartons, zappings = [], surPasser }) {
  const racine = document.createElement('div');
  racine.className = 'wi-cinema';
  racine.innerHTML = `
    <div class="wi-cadre">
      <svg class="wi-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${DEFS}<g class="wi-plans"></g></svg>
      <canvas class="wi-neige" width="160" height="90" aria-hidden="true"></canvas>
      <div class="wi-tube" aria-hidden="true"></div>
      <div class="wi-cartons wi-cartons-dedans" aria-live="polite"></div>
    </div>
    <div class="wi-cartons wi-cartons-dessous" aria-live="off"></div>
    <button type="button" class="wi-passer">Passer <span aria-hidden="true">›</span></button>`;
  conteneur.append(racine);

  const calque = racine.querySelector('.wi-plans');
  const neige = racine.querySelector('.wi-neige');
  const ctx2d = neige.getContext('2d');
  const tube = racine.querySelector('.wi-tube');
  const zonesCartons = [...racine.querySelectorAll('.wi-cartons')];
  racine.querySelector('.wi-passer').addEventListener('click', () => surPasser && surPasser());

  const montes = new Map();      // plan → { g, maj }
  let cartonCourant = null;
  const image = ctx2d.createImageData(160, 90);

  function bruit(force) {
    const d = image.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = Math.random() * 255;
      d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
    }
    ctx2d.putImageData(image, 0, 0);
    neige.style.opacity = force.toFixed(2);
  }

  function aller(T) {
    // les plans : un plan reste monté 0,1 s de part et d'autre de sa fenêtre (pas de trou entre deux plans)
    for (const p of plans) {
      const actif = T >= p.debut && T < p.fin;
      if (actif && !montes.has(p)) {
        const m = p.creer();
        montes.set(p, m);
        // ordre d'empilement : celui de la liste
        const suivant = plans.slice(plans.indexOf(p) + 1).map((q) => montes.get(q)).find(Boolean);
        calque.insertBefore(m.g, suivant ? suivant.g : null);
      } else if (!actif && montes.has(p)) {
        montes.get(p).g.remove();
        montes.delete(p);
      }
    }
    for (const [p, m] of montes) m.maj(T - p.debut, T);

    // la neige du zapping
    const z = zappings.find((x) => T >= x - 0.08 && T < x + 0.22);
    if (z !== undefined) bruit(0.85); else if (neige.style.opacity !== '0') neige.style.opacity = '0';

    // l'effet « tube cathodique » tant que l'on regarde la télé
    tube.classList.toggle('wi-allume', T < COUPURE + 0.8);

    // le carton du moment
    const c = cartons.find(([a, b]) => T >= a && T < b) || null;
    if (c !== cartonCourant) {
      cartonCourant = c;
      for (const zone of zonesCartons) {
        zone.innerHTML = c ? `<p class="wi-carton wi-${STYLES_CARTONS.has(c[3]) ? c[3] : 'recit'}">${c[4] ? c[4] : echappe(c[2])}</p>` : '';
      }
    }
    if (c) {
      const [a, b] = c, f = Math.min(1, (T - a) / 0.35, (b - T) / 0.35);
      for (const zone of zonesCartons) zone.style.opacity = f.toFixed(3);
    }
  }

  function detruire() {
    racine.remove();
    montes.clear();
  }

  return { racine, aller, detruire, cacherPasser: () => { racine.querySelector('.wi-passer').hidden = true; } };
}

export { NS };
