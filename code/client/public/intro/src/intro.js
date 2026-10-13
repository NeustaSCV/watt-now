/* Watt Now? — l'introduction. Deux points d'entrée :
   - jouerAccueil : les trois écrans d'accueil seuls (ce que le jeu intègre : voir NOTICE-DEV.md) ;
   - jouerIntro : la cinématique « La dernière émission » (3D, avec les personnages du jeu), puis les mêmes écrans
     (démonstration et export vidéo seulement : le jeu n'intègre pas la cinématique).
   Sans WebGL, l'accueil retombe sur la fiche des Compteurs (fiche.js), et la cinématique sur sa version dessinée (2D). */

import { SonIntro } from './son.js';
import { afficherFiche } from './fiche.js';
import { TITRE, FIN_CINEMATIQUE } from './temps.js';
import { watty } from './dessins.js';

const FAMILLES = ['charbonniers', 'voltaiques', 'mecanistes'];
const CONSEILS = [
  'Un bon est un reçu. Il se décharge : dépensez-le.',
  'La fumée se sent de loin. Les Éteints aussi la sentent.',
  'Watty ment. Les Compteurs comptent.',
  'Ne vous laissez jamais encercler.',
];

function chargerStyle(base) {
  if (document.querySelector('link[data-watt-intro]')) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = `${base}src/intro.css`; l.dataset.wattIntro = '1';
  document.head.append(l);
}

function webgl() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}

/** L'attente : Watty, une batterie qui se charge, un conseil des Compteurs. */
function attente(racine) {
  const div = document.createElement('div');
  div.className = 'wi-attente';
  div.innerHTML = `<div class="wi-attente-watty" aria-hidden="true">${watty('pouce', 110)}</div>
    <div class="wi-batterie" aria-hidden="true"><span></span></div>
    <p class="wi-attente-texte">Les Compteurs préparent votre dossier…</p>
    <p class="wi-attente-conseil">${CONSEILS[Math.floor(Math.random() * CONSEILS.length)]}</p>`;
  racine.append(div);
  const barre = div.querySelector('.wi-batterie span');
  return { avancer: (k) => (barre.style.width = `${Math.round(k * 100)}%`), retirer: () => div.remove() };
}

/**
 * Joue l'introduction complète.
 * @param {HTMLElement} conteneur  où poser l'intro (plein écran, au-dessus du reste)
 * @param {{ famille?: string, apparence?: object, base?: string, ctx?: AudioContext, destination?: AudioNode,
 *           volume?: number, depuis?: number, sansCss?: boolean, version?: '3d' | '2d' }} o
 *   famille   : 'charbonniers' | 'voltaiques' | 'mecanistes' (la fin et la 3e page de la fiche)
 *   apparence : l'apparence choisie à la création (commun/src/apparence.ts) ; sinon le personnage de référence
 *   base      : adresse du dossier intro/ tel qu'il est servi (par défaut './')
 *   ecrans    : (mise au point) aller directement à l'écran d'accueil n° 1, 2 ou 3
 *   ctx       : le contexte audio du jeu, s'il existe déjà (sinon l'intro crée le sien et le ferme à la fin)
 * @returns {Promise<void>}
 */
export async function jouerIntro(conteneur, o = {}) {
  const base = (o.base || './').replace(/\/?$/, '/');
  if (!o.sansCss) chargerStyle(base);
  const famille = FAMILLES.includes(o.famille) ? o.famille : 'charbonniers';
  const racine = document.createElement('div');
  racine.className = 'wi-racine';
  conteneur.append(racine);

  const son = new SonIntro({ ctx: o.ctx, destination: o.destination, base, volume: o.volume });
  const preparation = son.preparer();   // le geste du joueur vient d'avoir lieu : on débloque le son tout de suite
  const en3D = o.version !== '2d' && webgl();
  const att = attente(racine);
  let charges = 0;
  const compter = (p) => p.then((r) => { charges++; att.avancer((charges / (en3D ? 3 : 1)) * (en3D ? 0.75 : 1)); return r; });
  let cine3D = null;
  try {
    if (en3D) {
      const m = await compter(import('../src3d/cinematique3d.js'));
      await Promise.all([compter(preparation), compter(m.chargerTout())]);
      cine3D = m;
    } else await compter(preparation);
  } catch (e) {
    // sans son ni images, on montre quand même la fiche : le joueur ne doit jamais rester bloqué
    console.warn(e);
    att.retirer();
    await afficherFiche(racine, { famille });
    racine.remove();
    return;
  }
  let passe = false;
  let cine;
  if (cine3D) {
    cine = cine3D.monterCinematique3D(racine, { famille, apparence: o.apparence, surPasser: () => { passe = true; } });
    cine.cinema.style.visibility = 'hidden';
    racine.append(racine.querySelector('.wi-attente'));   // l'attente reste devant pendant qu'on construit les plans
    await cine.prechauffer((k) => att.avancer(0.75 + k * 0.25));
    cine.cinema.style.visibility = '';
    att.retirer();
    son.demarrer(o.ecrans ? TITRE : (o.depuis || 0), cine3D.montage(famille).radios);
  } else {
    att.retirer();
    const deux = await import('./cinematique2d.js');
    cine = deux.monter(racine, famille, () => { passe = true; });
    son.demarrer(o.depuis || 0, deux.radios());
  }

  if (typeof window !== 'undefined') window.__intro = { cine, son };   // mise au point
  // la boucle d'image : la cinématique, jusqu'au bouton « Continuer »
  if (!(o.ecrans && cine3D)) await new Promise((fini) => {
    let bouton = null, avant = performance.now();
    function image() {
      son.tic();
      if (passe) { son.passer(); passe = false; }
      const n = performance.now(), dt = Math.min(0.1, (n - avant) / 1000); avant = n;
      const T = son.temps();
      cine.image(Math.min(T, FIN_CINEMATIQUE + 600), dt);
      if (T >= TITRE + 3.2 && !bouton) {
        cine.cacherPasser();
        bouton = document.createElement('div');
        bouton.className = 'wi-titre-fin';
        bouton.innerHTML = '<button type="button" class="wi-continuer">Continuer</button>';
        cine.cadre.append(bouton);
        bouton.querySelector('button').addEventListener('click', () => { termine = true; fini(); }, { once: true });
        bouton.querySelector('button').focus({ preventScroll: true });
      }
      if (!termine) requestAnimationFrame(image);
    }
    let termine = false;
    requestAnimationFrame(image);
  });

  // les écrans d'accueil : en 3D, des tableaux vivants dans le même cadre (la musique du titre continue dessous) ;
  // sinon, la fiche d'accueil des Compteurs
  if (cine3D) {
    const { afficherEcrans } = await import('../src3d/ecrans.js');
    await afficherEcrans({ cine, plans: cine.accueil, tic: () => son.tic(), page: o.ecrans ? o.ecrans - 1 : 0 });
    cine.detruire();
  } else {
    let encore = true;
    (function entretenir() { if (!encore) return; son.tic(); requestAnimationFrame(entretenir); })();
    cine.detruire();
    await afficherFiche(racine, { famille });
    encore = false;
  }
  await son.terminer(2.5);
  racine.remove();
}

/** Mise au point : ouvre la fiche d'accueil à une page donnée. */
export function ouvrirFiche(conteneur, o = {}) {
  chargerStyle((o.base || './').replace(/\/?$/, '/'));
  const racine = document.createElement('div');
  racine.className = 'wi-racine';
  conteneur.append(racine);
  return afficherFiche(racine, o);
}

/**
 * Les trois écrans d'accueil seuls, sans la cinématique (c'est ce que le jeu intègre) : ton terrain, les lieux
 * lointains, le Comptoir. Écran de chargement (la batterie), puis les trois tableaux 3D construits d'avance,
 * puis « Suivant », « Suivant », « Entrer dans le monde ». Sans WebGL (ou en cas d'erreur) : la fiche des Compteurs.
 * Pas de son : la musique reste celle du jeu.
 * @param {HTMLElement} conteneur  l'élément où dessiner (plein écran : document.body convient)
 * @param {{ famille?: string, apparence?: object, base?: string, sansCss?: boolean, page?: number, qualite?: 'haute'|'basse' }} o
 *   base : l'adresse du dossier intro/ tel qu'il est servi (« /intro/ ») ; page : 1, 2 ou 3 (mise au point) ;
 *   qualite : « haute » (occlusion ambiante, anticrénelage, profondeur de champ) ou « basse » ; par défaut, basse sur écran tactile
 * @returns {Promise<void>} résolue quand le joueur a cliqué sur « Entrer dans le monde »
 */
export async function jouerAccueil(conteneur, o = {}) {
  const base = (o.base || './').replace(/\/?$/, '/');
  if (!o.sansCss) chargerStyle(base);
  const famille = FAMILLES.includes(o.famille) ? o.famille : 'charbonniers';
  const racine = document.createElement('div');
  racine.className = 'wi-racine';
  conteneur.append(racine);
  const att = attente(racine);
  try {
    if (!webgl()) throw new Error('pas de WebGL');
    const [m, k, acteurs] = await Promise.all([import('../src3d/cinematique3d.js'), import('../src3d/kenney.js'), import('../src3d/acteurs.js')]);
    k.definirBase(new URL(base, location.href).pathname);
    att.avancer(0.2);
    await acteurs.pret({ gestes: false });   // les écrans d'accueil n'utilisent que les gestes du jeu
    att.avancer(0.6);
    const qualite = o.qualite || (matchMedia('(pointer: coarse)').matches ? 'basse' : 'haute');
    const cine = m.monterCinematique3D(racine, { famille, apparence: o.apparence, accueilSeul: true, qualite });
    cine.cinema.style.visibility = 'hidden';
    racine.append(racine.querySelector('.wi-attente'));
    await cine.prechauffer((x) => att.avancer(0.6 + x * 0.4));
    cine.cinema.style.visibility = '';
    att.retirer();
    const { afficherEcrans } = await import('../src3d/ecrans.js');
    await afficherEcrans({ cine, plans: cine.accueil, page: o.page ? o.page - 1 : 0 });
    cine.detruire();
  } catch (e) {
    console.warn('Accueil : version de secours', e);
    att.retirer();
    racine.querySelector('.wi-cinema')?.remove();
    await afficherFiche(racine, { famille });
  }
  racine.remove();
}
