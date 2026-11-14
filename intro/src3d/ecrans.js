/* Watt Now? — intro 3D : les écrans d'accueil, après la cinématique (direction « tableaux 3D », validée par le porteur).
   Chaque écran est un tableau vivant (src3d/accueil.js) rendu par le moteur de la cinématique ; par-dessus : le titre,
   le texte, et des étiquettes accrochées à des points du monde (elles suivent la caméra). Le joueur clique sur « Suivant ».
   Image trop petite : le texte sort de l'image, dessous (téléphone tenu droit) ou à côté (téléphone couché) ;
   les étiquettes restent sur l'image, plus courtes. */

import { THREE } from '../vendor/rendu-jeu.js';
import { ACCUEIL } from '../src/temps.js';

const ECRANS = [
  {
    titre: 'Ton terrain',
    texte: 'Ici, tu es chez toi : tu bâtis, tu cultives, tu t\'installes comme tu veux. <b>Aucun joueur ne peut t\'y attaquer.</b> Seuls quelques Éteints peuvent venir, si tu fais trop de bruit ou trop de lumière.',
    note: 'Le feu attire les curieux. Tous les curieux.',
    etiquettes: [
      { repere: 'toi', titre: 'Toi', cote: 'droite' },
      { repere: 'feu', titre: 'Ton feu', texte: 'Il chauffe, il cuit… et il se voit de loin.', cote: 'gauche' },
      { repere: 'eteints', titre: 'Des Éteints', texte: 'Le bruit et la lumière les attirent.', cote: 'gauche' },
    ],
  },
  {
    titre: 'Les lieux lointains',
    texte: 'Pars en expédition vers des lieux éloignés pour y <b>récupérer des ressources</b>. Plus un lieu est riche, plus il est loin et dangereux. Certains lieux sont <b>multijoueurs</b>, d\'autres non.',
    note: 'Le S de l\'enseigne est tombé. Les Éteints, eux, sont restés.',
    etiquettes: [
      { repere: 'hotel', titre: 'Le Grand Hôtel des Flots', texte: 'Station balnéaire · danger ●●●', cote: 'droite' },
      { repere: 'terrasse', titre: 'La terrasse', texte: 'Transats, buvette, cuisines : tout se fouille.', cote: 'gauche' },
    ],
  },
  {
    titre: 'Le Comptoir',
    texte: 'Un terrain <b>neutre</b>, où personne ne se bat. On y fait du commerce, on y <b>troque</b>, on y <b>apprend</b> ce que les autres familles savent faire… et on y <b>enseigne</b> ce que l\'on sait.',
    note: 'Watty ment. Les Compteurs comptent.',
    etiquettes: [
      { repere: 'guichet', titre: 'Le guichet des Compteurs', texte: 'Dépose ton énergie, reçois des wotts.', cote: 'droite' },
      { repere: 'troc', titre: 'Le troc', texte: 'De la main à la main.', cote: 'gauche' },
      { repere: 'lecon', titre: 'Une leçon', texte: 'Un geste, appris d\'une autre famille.', cote: 'droite', bas: true },
    ],
  },
];

/**
 * Montre les écrans d'accueil dans le cadre de la cinématique.
 * @param {{ cine: object, plans: object[], tic?: () => void, page?: number }} o
 *   cine : le lecteur (monterCinematique3D) ; plans : ses plans d'accueil (même ordre que ECRANS)
 * @returns {Promise<void>} résolue quand le joueur entre dans le monde
 */
export function afficherEcrans(o) {
  const { cine, plans } = o;
  const cadre = cine.cadre;
  cine.cacherPasser();
  const couche = document.createElement('div');
  couche.className = 'wi-ecran';
  couche.innerHTML = `
    <svg class="wi-fils" aria-hidden="true"></svg>
    <div class="wi-etiquettes"></div>
    <div class="wi-ecran-entete"><span>Les Compteurs · <b>Accueil</b></span> · <span class="wi-ecran-num"></span></div>
    <p class="wi-ecran-note"></p>
    <div class="wi-ecran-bas">
      <h2 class="wi-ecran-titre" id="wi-ecran-titre"></h2>
      <p class="wi-ecran-texte"></p>
      <div class="wi-ecran-pied">
        <div class="wi-pages" aria-hidden="true">${ECRANS.map(() => '<span></span>').join('')}</div>
        <button type="button" class="wi-suivant"></button>
      </div>
    </div>
    <div class="wi-ecran-voile"></div>`;
  couche.setAttribute('role', 'dialog');
  couche.setAttribute('aria-modal', 'true');
  couche.setAttribute('aria-labelledby', 'wi-ecran-titre');
  cadre.append(couche);
  const bas = couche.querySelector('.wi-ecran-bas');
  const fils = couche.querySelector('.wi-fils');
  const etiq = couche.querySelector('.wi-etiquettes');
  const voile = couche.querySelector('.wi-ecran-voile');
  const bouton = couche.querySelector('.wi-suivant');

  // l'échelle : tout est dessiné pour un cadre de 1600 px de large. Si l'image pleine taille ferait moins de 380 px de
  // haut, le texte sort de l'image : dessous sur un téléphone tenu droit, à côté sur un écran bas et large (téléphone couché)
  function ajuster() {
    const l = window.innerWidth, h = window.innerHeight;
    const compact = Math.min(l * 9 / 16, h) < 380;
    const cote = compact && l > h;
    couche.classList.toggle('wi-compact', compact);
    cine.cinema.classList.toggle('wi-cote', cote);
    const r = cadre.getBoundingClientRect();
    couche.style.setProperty('--u', (r.width / 1600).toFixed(4));
    if (compact && bas.parentNode !== cine.cinema) cine.cinema.append(bas);
    if (!compact && bas.parentNode !== couche) couche.insertBefore(bas, voile);
  }
  ajuster();
  window.addEventListener('resize', ajuster);

  let i = Math.max(0, Math.min(ECRANS.length - 1, o.page || 0));
  let t0 = performance.now(), avant = t0, change = -1;
  const v = new THREE.Vector3();

  function montrer() {
    const e = ECRANS[i];
    couche.querySelector('.wi-ecran-num').textContent = `${i + 1} / ${ECRANS.length}`;
    bas.querySelector('.wi-ecran-titre').textContent = e.titre;   // (le bas peut être sous l'image : on le cherche chez lui)
    bas.querySelector('.wi-ecran-texte').innerHTML = e.texte;
    couche.querySelector('.wi-ecran-note').textContent = e.note;
    bas.querySelectorAll('.wi-pages span').forEach((s, k) => s.classList.toggle('wi-ici', k === i));
    bouton.textContent = i === ECRANS.length - 1 ? 'Entrer dans le monde' : 'Suivant ›';
    etiq.innerHTML = e.etiquettes.map((x) => `<div class="wi-etiquette wi-${x.cote}"><strong>${x.titre}</strong>${x.texte ? `<small>${x.texte}</small>` : ''}</div>`).join('');
    fils.innerHTML = e.etiquettes.map(() => '<path/><circle r="5"/><circle class="wi-halo" r="10"/>').join('');
    for (const el of [couche, bas]) { el.classList.remove('wi-entre'); void el.offsetWidth; el.classList.add('wi-entre'); }
    t0 = performance.now();
    bouton.focus({ preventScroll: true });
  }

  /** Les étiquettes suivent leurs points du monde : projetés à l'écran, l'étiquette à côté, un fil jusqu'au point. */
  function placer() {
    const inst = cine.moteur.montes.get(plans[i]);
    if (!inst || !inst.reperes) return;
    const r = cadre.getBoundingClientRect();
    const reperes = inst.reperes();
    const u = r.width / 1600;
    const boites = etiq.children, chemins = fils.children;
    fils.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
    ECRANS[i].etiquettes.forEach((x, k) => {
      const p = reperes[x.repere];
      const b = boites[k];
      if (!p || !b) return;
      v.copy(p).project(inst.camera);
      const visible = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
      const px = (v.x + 1) / 2 * r.width, py = (1 - v.y) / 2 * r.height;
      const dx = (x.cote === 'gauche' ? -1 : 1) * 70 * u, dy = (x.bas ? 70 : -60) * u;   // `bas` : l'étiquette sous son point
      const bx = px + dx, by = py + dy;
      b.style.transform = `translate(${x.cote === 'gauche' ? `calc(${bx}px - 100%)` : `${bx}px`}, ${x.bas ? `${by}px` : `calc(${by}px - 100%)`})`;
      b.style.opacity = visible ? '' : '0';
      chemins[k * 3].setAttribute('d', `M${bx} ${by} L${px} ${py}`);
      chemins[k * 3 + 1].setAttribute('cx', px); chemins[k * 3 + 1].setAttribute('cy', py);
      chemins[k * 3 + 2].setAttribute('cx', px); chemins[k * 3 + 2].setAttribute('cy', py);
      for (const c of [chemins[k * 3], chemins[k * 3 + 1], chemins[k * 3 + 2]]) c.style.opacity = visible ? '' : '0';
    });
  }

  return new Promise((fini) => {
    let fin = false;
    bouton.addEventListener('click', () => {
      if (change >= 0) return;
      change = performance.now();   // un fondu au noir, puis l'écran suivant (ou l'entrée dans le monde)
      voile.classList.add('wi-noir');
      setTimeout(() => {
        if (i === ECRANS.length - 1) { fin = true; return; }
        i++; montrer();
        voile.classList.remove('wi-noir');
        change = -1;
      }, 600);
    });
    function image() {
      if (fin) {
        window.removeEventListener('resize', ajuster);
        cine.cinema.classList.remove('wi-cote');
        couche.remove(); if (bas.parentNode) bas.remove();
        fini();
        return;
      }
      o.tic && o.tic();
      const n = performance.now(), dt = Math.min(0.1, (n - avant) / 1000); avant = n;
      const t = (n - t0) / 1000;
      cine.image(ACCUEIL + i * 1000 + Math.min(t, 900), dt);
      placer();
      requestAnimationFrame(image);
    }
    montrer();
    requestAnimationFrame(image);
  });
}
