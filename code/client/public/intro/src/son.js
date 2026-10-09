/* Watt Now? — intro : le son, et l'horloge qui pilote l'image.
   - La télé (0 → 33 s) est synthétisée (tele-sons.js).
   - Le thème principal (musique/production/mobile/titre, prémixé) part à 33 s : jingle Watty, coupure,
     naissance, les trois familles, puis la queue qui boucle sous le titre et la fiche d'accueil.
   - L'horloge est celle du contexte audio : l'image suit toujours le son, même si l'appareil rame. */

import { THEME, TITRE, BOUCLE } from './temps.js';
import { chaineTele, chaineRadio, programmerTele } from './tele-sons.js';

function extension() {
  const a = document.createElement('audio');
  return a.canPlayType && a.canPlayType('audio/ogg; codecs="opus"') ? 'opus' : 'm4a';
}

async function charger(ctx, url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Intro : ${url} introuvable (${r.status})`);
  const donnees = await r.arrayBuffer();
  return await new Promise((ok, ko) => ctx.decodeAudioData(donnees, ok, ko));
}

export class SonIntro {
  /**
   * @param {{ ctx?: AudioContext, destination?: AudioNode, base?: string, volume?: number }} o
   *   base : l'adresse du dossier qui contient assets/musique/ (par défaut, celui de la page).
   */
  constructor(o = {}) {
    this.ctxFourni = !!o.ctx;
    this.horsLigne = typeof OfflineAudioContext !== 'undefined' && o.ctx instanceof OfflineAudioContext;
    this.ctx = o.ctx || new (window.AudioContext || window.webkitAudioContext)();
    this.base = (o.base || './').replace(/\/?$/, '/');
    this.maitre = this.ctx.createGain();
    this.maitre.gain.value = o.volume ?? 1;
    this.maitre.connect(o.destination || this.ctx.destination);
    this.busCinema = this.ctx.createGain(); this.busCinema.connect(this.maitre);
    this.busBoucle = this.ctx.createGain(); this.busBoucle.connect(this.maitre);
    this.tele = chaineTele(this.ctx, this.busCinema);
    this.radio = chaineRadio(this.ctx, this.busCinema);
    this.sources = [];
    this.boucles = [];
    this.t0 = null;
    this.prochaineBoucle = Infinity;
    this.surVisibilite = () => {
      if (document.hidden) this.ctx.suspend && this.ctx.suspend();
      else this.ctx.resume && this.ctx.resume();
    };
  }

  /** Débloque le son (à appeler pendant un geste du joueur) et charge le thème. */
  async preparer() {
    // sans geste du joueur, le navigateur peut laisser cette promesse en attente pour toujours : on n'attend pas plus d'1 s
    if (!this.horsLigne && this.ctx.state === 'suspended') await Promise.race([this.ctx.resume().catch(() => {}), new Promise((ok) => setTimeout(ok, 1000))]);
    const ext = extension();
    const dossier = `${this.base}assets/musique/`;
    [this.theme, this.boucle] = await Promise.all([
      charger(this.ctx, `${dossier}titre_b1_mix.${ext}`),
      charger(this.ctx, `${dossier}titre_b2_mix.${ext}`),
    ]);
  }

  /** Lance la cinématique à l'instant `depuis` (secondes). */
  demarrer(depuis = 0, radios = [], avance = 0.12) {
    const ctx = this.ctx;
    this.t0 = ctx.currentTime + avance - depuis;
    programmerTele(ctx, this.tele.entree, this.radio.entree, this.t0, depuis, this.sources, radios);
    // le thème principal
    const src = ctx.createBufferSource();
    src.buffer = this.theme; src.connect(this.busCinema);
    const quand = this.t0 + THEME;
    if (depuis <= THEME) src.start(quand);
    else if (depuis - THEME < this.theme.duration) src.start(ctx.currentTime + 0.05, depuis - THEME + 0.05);
    this.sources.push(src);
    this.prochaineBoucle = Math.max(TITRE, TITRE + Math.ceil((depuis - TITRE) / BOUCLE) * BOUCLE);
    if (!this.horsLigne) document.addEventListener('visibilitychange', this.surVisibilite);
  }

  /** Le temps de la cinématique, en secondes. */
  temps() {
    return this.t0 === null ? 0 : this.ctx.currentTime - this.t0;
  }

  /** À appeler à chaque image : programme les tours de boucle à l'avance. */
  tic() {
    const T = this.temps();
    while (this.prochaineBoucle - T < 1.5) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.boucle; src.connect(this.busBoucle);
      src.start(Math.max(this.ctx.currentTime, this.t0 + this.prochaineBoucle));
      this.boucles.push(src);
      if (this.boucles.length > 3) this.boucles.shift();
      this.prochaineBoucle += BOUCLE;
    }
  }

  /** Pour l'export : programme d'un coup tous les tours de boucle jusqu'à l'instant `fin` (secondes de cinématique). */
  programmerJusqua(fin) {
    while (this.prochaineBoucle < fin) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.boucle; src.connect(this.busBoucle);
      src.start(this.t0 + this.prochaineBoucle);
      this.prochaineBoucle += BOUCLE;
    }
  }

  /** « Passer » : la télé et le thème s'effacent, la boucle du titre prend le relais tout de suite. */
  passer() {
    const ctx = this.ctx, t = ctx.currentTime;
    this.busCinema.gain.cancelScheduledValues(t);
    this.busCinema.gain.setValueAtTime(this.busCinema.gain.value, t);
    this.busCinema.gain.linearRampToValueAtTime(0, t + 0.6);
    const anciennes = this.sources; this.sources = [];
    setTimeout(() => anciennes.forEach((s) => { try { s.stop(); } catch (e) { /* déjà arrêtée */ } }), 800);
    if (this.temps() < TITRE) {
      // on recale l'horloge sur le début de la boucle, avec une entrée en fondu
      this.t0 = t + 0.4 - TITRE;
      this.prochaineBoucle = TITRE;
      this.busBoucle.gain.setValueAtTime(0, t);
      this.busBoucle.gain.linearRampToValueAtTime(1, t + 2.5);
    }
  }

  /** Fin : tout s'efface en `fondu` secondes. */
  async terminer(fondu = 2.5) {
    const ctx = this.ctx, t = ctx.currentTime;
    this.maitre.gain.cancelScheduledValues(t);
    this.maitre.gain.setValueAtTime(this.maitre.gain.value, t);
    this.maitre.gain.linearRampToValueAtTime(0, t + fondu);
    this.prochaineBoucle = Infinity;
    await new Promise((ok) => setTimeout(ok, fondu * 1000 + 100));
    [...this.sources, ...this.boucles].forEach((s) => { try { s.stop(); } catch (e) { /* déjà arrêtée */ } });
    this.maitre.disconnect();
    document.removeEventListener('visibilitychange', this.surVisibilite);
    if (!this.ctxFourni) await ctx.close().catch(() => {});
  }
}
