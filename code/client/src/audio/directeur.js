/* Watt Now? — directeur musical (Book 21 §6.2.3 et §6.4.1).
   Machine à états pure : elle ne joue aucun son. Elle reçoit l'état du jeu (menace, jour ou nuit)
   et renvoie des commandes datées sur l'horloge musicale (volume d'une couche ou d'un stem, signal, pièce).
   Le moteur (moteur-couches.js) les applique. Testable dans Node (test-directeur.mjs).

   Couches : fond, vie, tension, danger. Une couche se coupe par son volume, jamais en l'arrêtant.
   Règles :
   - Calme, jour : Fond + Vie. Après 3 à 4 blocs de Vie, une fenêtre de silence de 30 à 90 s (Fond seul) ; la nuit, plus longue.
   - Menace (Éteint attiré ou poursuivant) depuis ≥ 2 s : Tension sur le temps fort suivant ; la Vie perd harmonie et effets.
   - Saisie : Danger sur le temps suivant (≤ 0,7 s à 84 BPM).
   - Fin de menace (10 s sans menace pour la Tension ; dès le dégagement pour le Danger) : Silence 4 à 8 s, puis Fond.
     La Vie revient à la frontière de bloc suivante, après 20 s de calme.
   - Jamais de va-et-vient : hystérésis à l'entrée (2 s) et à la sortie (10 s).
   Coopérative (Book 23) : la musique suit la PROFONDEUR. Le Fond est une seule pièce à trois stems (dehors, dedans, froid) :
   passer une porte change de stem à la mesure suivante (fondu d'une mesure). L'Exploration ne joue que dehors.
   Menace « nombre » (3 Éteints ou plus sur le joueur) : le Danger, plus son stem « nombre ». */

export const STEMS_VIE = ['rythmique', 'basse', 'harmonie', 'effets', 'melodie', 'outil', 'pulsation', 'texture'];
const STEM_OUTIL = 'outil';                                        // la percussion faite du son de l'atelier : le thème « au complet »
/* Stems de la couche « vie » selon le lieu. Au terrain : la Vie de la famille ; à la halte : l'Exploration.
   perdus : ce que la Vie perd en Tension (« harmonie et mélodie ») ; garde : ce qu'elle garde, plus bas. */
const LIEUX = {
  terrain: { jour: ['rythmique', 'basse', 'harmonie', 'effets'], nuit: ['basse', 'harmonie', 'melodie'], perdus: ['harmonie', 'effets', 'melodie', 'outil'], garde: ['rythmique', 'basse'] },
  halte: { jour: ['pulsation', 'basse', 'texture'], nuit: ['pulsation', 'basse', 'texture'], perdus: ['texture'], garde: ['pulsation', 'basse'] },
  cooperative: { jour: ['pulsation', 'basse', 'harmonie', 'melodie'], nuit: ['pulsation', 'basse', 'harmonie', 'melodie'], perdus: ['harmonie', 'melodie'], garde: ['pulsation', 'basse'] },
  comptoir: { jour: ['rythmique', 'basse', 'harmonie', 'melodie'], nuit: ['rythmique', 'basse', 'harmonie', 'melodie'], perdus: [], garde: [] }
};
/* Coopérative : les zones, chacune un stem de la pièce de Fond */
export const ZONES = ['dehors', 'dedans', 'froid'];
const SAISIE = (m) => m === 'saisie' || m === 'nombre';

export class Directeur {
  /**
   * @param horloge objet { suivant(t, unite) } ; unite : 'maintenant' | 'temps' | 'tempsFort' | 'mesure' | 'bloc'
   *                et { dureeMesure }
   * @param options durées (secondes), `echelle` pour accélérer les fenêtres de silence en test, `alea` (0..1)
   */
  constructor(horloge, options) {
    this.h = horloge;
    this.o = Object.assign({
      entreeTension: 2, sortieTension: 10,
      silenceMin: 4, silenceMax: 8,
      calmeAvantVie: 20,
      blocsVieMin: 3, blocsVieMax: 4,
      fenetreMin: 30, fenetreMax: 90,
      fenetreNuitMin: 60, fenetreNuitMax: 150,
      echelle: 1,
      attendreFeu: false,          // tutoriel : la Vie n'entre pas avant le premier feu (moment-vitrine 2)
      lieu: 'terrain',             // terrain | halte | cooperative | comptoir (zone sûre : jamais de Tension ni de Danger, 96 BPM)
      alea: Math.random
    }, (options && options.lieu === 'cooperative') ? { calmeAvantVie: 8 } : {}, options || {});
    this.zone = 'dehors';           // coopérative : dehors | dedans | froid
    this.phase = 'arret';           // arret | calme | tension | danger | silence | sommeil
    this.menace = 'aucune';         // aucune | attire | poursuite | saisie | nombre (coopérative : saisie, 3 Éteints ou plus)
    this.menaceDepuis = 0;
    this.sansMenaceDepuis = 0;
    this.moment = 'jour';
    this.momentCible = 'jour';
    this.vie = false;               // la Vie joue-t-elle ?
    this.premiereVie = true;        // la toute première entrée se fait un instrument à la fois, sur 16 mesures
    this.feuAllume = false;
    this.atelier = false;           // l'atelier de la famille est installé : le thème joue au complet (le jour)
    this.blocsVie = 0;
    this.quotaVie = 3;
    this.finFenetre = 0;
    this.calmeDepuis = 0;
    this.finSilence = 0;
    this.journal = [];
    this._cmds = [];
  }

  /* ---------- Entrées ---------- */

  demarrer(t) {
    this.phase = 'calme';
    this.calmeDepuis = t;
    this._gain('fond', null, 1, this.h.suivant(t, 'maintenant'), 3);
    if (this.o.lieu === 'comptoir') {
      /* Comptoir : zone sûre ; le signal d'arrivée, puis le groove au complet, sans fenêtres de silence */
      const tm = this.h.suivant(t, 'mesure');
      this._cmds.push({ type: 'signal', nom: 'comptoir', at: tm });
      this._entreeVie(tm + this.h.dureeMesure, false, true);
      this.quotaVie = Infinity; this.premiereVie = false; this.feuAllume = true;
      this._log(t, 'Arrivée au Comptoir : signal, puis le groove (zone sûre : pas de Tension).');
      return this._sortir();
    }
    if (this.o.lieu === 'halte') {
      /* Halte : au chargement de la carte, sur le signal d'arrivée, le Fond de la halte et l'Exploration (Book 21 §6.2.3) */
      const tm = this.h.suivant(t, 'mesure');
      this._cmds.push({ type: 'signal', nom: 'arriveeHalte', at: tm });
      this._entreeVie(tm + 2 * this.h.dureeMesure, false, true);
      this.premiereVie = false; this.feuAllume = true;
      this._log(t, 'Arrivée à la halte : signal, puis le Fond de la halte et l\'Exploration.');
      return this._sortir();
    }
    if (this.o.lieu === 'cooperative') {
      /* Coopérative : signal d'arrivée au portail, le Fond de la zone seul ; l'Exploration au premier bloc après 8 s de calme */
      this._cmds.push({ type: 'signal', nom: 'arriveeCoop', at: this.h.suivant(t, 'mesure') });
      ZONES.forEach((z) => this._gain('fond', z, z === this.zone ? 1 : 0, this.h.suivant(t, 'maintenant'), 0.03));
      this._gain('danger', 'nombre', 0, this.h.suivant(t, 'maintenant'), 0.03);
      this.premiereVie = false; this.feuAllume = true;
      this._log(t, 'Arrivée à la coopérative : signal, le Fond (' + this.zone + ') ; l\'Exploration entrera à un bloc après ' + this._d(this.o.calmeAvantVie) + ' s de calme.');
      return this._sortir();
    }
    this._log(t, 'Démarrage : Fond seul. La Vie entrera après ' + this._d(this.o.calmeAvantVie) + ' s de calme, à une frontière de bloc.');
    return this._sortir();
  }

  /** Niveau de menace actuel, tel que le jeu le voit. */
  signalerMenace(niveau, t) {
    if (niveau === this.menace) return this._sortir();
    const avant = this.menace;
    this.menace = niveau;
    if (avant === 'aucune') this.menaceDepuis = t;
    if (niveau === 'aucune') this.sansMenaceDepuis = t;
    this._log(t, 'Menace : ' + avant + ' → ' + niveau);
    if (this.phase === 'danger' && SAISIE(avant) && SAISIE(niveau)) this._nombre(this.h.suivant(t, 'temps'));
    return this.mettreAJour(t);
  }

  /** Jour ou nuit : le signal sonne tout de suite (à la mesure), la musique change à la frontière de bloc. */
  changerMoment(moment, t) {
    if (moment === this.momentCible) return this._sortir();
    this.momentCible = moment;
    this._cmds.push({ type: 'signal', nom: moment === 'nuit' ? 'crepuscule' : 'aube', at: this.h.suivant(t, 'mesure') });
    this._log(t, (moment === 'nuit' ? 'Crépuscule' : 'Aube') + ' : signal à la mesure, changement de musique au prochain bloc.');
    return this._sortir();
  }

  /** Coopérative : le joueur passe une porte. Le Fond change de stem à la mesure suivante (fondu d'une mesure) ;
      dedans et dans la chambre froide, l'Exploration se tait ; de retour dehors, elle revient à un bloc, après le calme. */
  changerZone(zone, t) {
    if (this.o.lieu !== 'cooperative' || zone === this.zone || !ZONES.includes(zone)) return this._sortir();
    const at = this.h.suivant(t, 'mesure'), fondu = this.h.dureeMesure;
    this.zone = zone;
    ZONES.forEach((z) => this._gain('fond', z, z === zone ? 1 : 0, at, fondu));
    if (zone !== 'dehors') {
      if (this.vie) this._stemsLieu().forEach((s) => this._gain('vie', s, 0, at, fondu));
      this.vie = false;
    } else { this.calmeDepuis = Math.max(this.calmeDepuis, t); this.finFenetre = 0; }
    this._log(t, 'Zone : ' + zone + ' (à la mesure, dans ' + (at - t).toFixed(2) + ' s)' + (zone === 'dehors' ? ' ; l\'Exploration reviendra à un bloc, après le calme.' : ' ; l\'Exploration se tait.'));
    return this._sortir();
  }

  /** Stems à décoder et à lancer (le reste est libéré : c'est ce qui tient la mémoire, Book 21 §6.4.4) */
  stemUtile(couche, stem) {
    if (stem === 'outil') return this.atelier;
    if (this.o.lieu !== 'cooperative') return true;
    if (couche === 'fond') return !ZONES.includes(stem) || stem === this.zone;
    if (couche === 'vie') return this.zone === 'dehors';
    if (couche === 'danger' && stem === 'nombre') return this.menace === 'nombre';
    return true;
  }

  /** Le premier feu (moment-vitrine 2) : un souffle chaud monte du feu à la mesure suivante,
      puis la Vie entre pour la première fois, un instrument toutes les 4 mesures (la matière de la famille d'abord). */
  premierFeu(t) {
    const premier = !this.feuAllume;
    this.feuAllume = true;
    if (!premier || this.phase !== 'calme' || this.vie) return this._sortir();
    const tm = this.h.suivant(t, 'mesure');
    this._cmds.push({ type: 'signal', nom: 'feu', at: tm });
    this._entreeVie(tm + this.h.dureeMesure, true);
    this.premiereVie = false;
    this._log(t, 'Premier feu : souffle chaud à la mesure, puis la Vie naît du feu, un instrument toutes les 4 mesures.');
    return this._sortir();
  }

  /** L'installation de famille (moment-vitrine 4) : à la mesure suivante, le thème de famille entre au complet,
      d'un seul coup, avec sa percussion faite du son de l'atelier. Ensuite, la Vie de jour joue toujours au complet. */
  installerAtelier(t) {
    if (this.atelier) return this._sortir();
    this.atelier = true; this.feuAllume = true;
    if (this.phase !== 'calme' || this.moment === 'nuit') { this._log(t, 'Atelier installé : le thème jouera au complet à la prochaine entrée de la Vie (le jour).'); return this._sortir(); }
    const tm = this.h.suivant(t, 'mesure');
    this.vie = false;
    this._entreeVie(tm, false, true);
    this.premiereVie = false;
    this._log(t, 'Atelier installé : le thème de famille entre au complet à la mesure, avec sa percussion faite du son de l\'atelier.');
    return this._sortir();
  }

  /** Le personnage s'endort : motif court (signal), puis silence complet. */
  dormir(t) {
    if (this.phase === 'sommeil') return this._sortir();
    const at = this.h.suivant(t, 'mesure');
    this.phase = 'sommeil';
    this._cmds.push({ type: 'signal', nom: 'endormissement', at });
    ['fond', 'tension', 'danger'].forEach((c) => this._gain(c, null, 0, at, 4));
    this._stemsLieu().forEach((s) => this._gain('vie', s, 0, at, 4));
    this.vie = false;
    this._log(t, 'Endormissement : motif court à la mesure, puis silence.');
    return this._sortir();
  }

  /** Réveil : signal de l'aube, retour du jour ; le Fond revient doucement, la Vie plus tard. */
  reveiller(t) {
    const at = this.h.suivant(t, 'mesure');
    this.phase = 'calme';
    this.momentCible = 'jour';
    this._cmds.push({ type: 'signal', nom: 'aube', at });
    this._gain('fond', null, 1, at + 2, 6);
    this.calmeDepuis = t; this.finFenetre = 0;
    this._log(t, 'Réveil : signal de l\'aube, le Fond revient ; musique de jour au prochain bloc.');
    return this._sortir();
  }

  /** À appeler à chaque instant (≈ toutes les 50 ms). */
  mettreAJour(t) {
    const m = this.menace, o = this.o;
    if (this.phase === 'arret' || this.o.lieu === 'comptoir') return this._sortir();       // au Comptoir, aucune menace ne compte
    if (SAISIE(m) && this.phase !== 'danger') this._danger(t);
    else if (this.phase === 'danger' && !SAISIE(m)) {
      if (m === 'aucune') this._silence(t, 'degagement');
      else this._tension(t, 'temps');
    } else if ((m === 'attire' || m === 'poursuite') && (this.phase === 'calme' || this.phase === 'silence' || this.phase === 'sommeil') && t - this.menaceDepuis >= o.entreeTension) {
      this._tension(t, 'tempsFort');
    } else if (this.phase === 'tension' && m === 'aucune' && t - this.sansMenaceDepuis >= o.sortieTension) {
      this._silence(t, null);
    } else if (this.phase === 'silence' && t >= this.finSilence) {
      this.phase = 'calme';
      this.calmeDepuis = this.sansMenaceDepuis;
      this._gain('fond', null, 1, this.h.suivant(t, 'maintenant'), 4);
      this._log(t, 'Fin du silence : Fond. La Vie reviendra au prochain bloc après ' + this._d(o.calmeAvantVie) + ' s de calme.');
    }
    return this._sortir();
  }

  /** Le moteur l'appelle juste avant chaque frontière de bloc (tb : instant exact du bloc). */
  avantBloc(tb) {
    const o = this.o;
    if (this.momentCible !== this.moment && this.o.lieu === 'terrain') {
      this.moment = this.momentCible;
      this._cmds.push({ type: 'piece', couche: 'fond', piece: this.moment === 'nuit' ? 'fond-nuit' : 'fond-jour', at: tb });
      this._cmds.push({ type: 'piece', couche: 'vie', piece: this.moment === 'nuit' ? 'vie-nuit' : 'vie-jour', at: tb });
      if (this.vie && this.phase === 'calme') this._entreeVie(tb, false);   // la Vie passe en version de nuit (ou de jour)
      this._log(tb, 'Bloc : passage en musique de ' + this.moment + '.');
    }
    if (this.phase !== 'calme') return this._sortir();
    if (this.vie) {
      this.blocsVie++;
      if (this.blocsVie >= this.quotaVie) {
        this.vie = false;
        this._stemsLieu().forEach((s) => this._gain('vie', s, 0, tb, 4));
        const nuit = this.moment === 'nuit';
        const f = this._entre(nuit ? o.fenetreNuitMin : o.fenetreMin, nuit ? o.fenetreNuitMax : o.fenetreMax) * o.echelle;
        this.finFenetre = tb + f;
        this._log(tb, 'Bloc : fin du passage de Vie (' + this.blocsVie + ' blocs). Fenêtre de silence de ' + Math.round(f) + ' s : Fond seul.');
      }
    } else if (tb >= this.finFenetre && tb - this.calmeDepuis >= o.calmeAvantVie * o.echelle && (this.feuAllume || !o.attendreFeu) && (o.lieu !== 'cooperative' || this.zone === 'dehors')) {
      this._entreeVie(tb, this.premiereVie);
      this.premiereVie = false;
    }
    return this._sortir();
  }

  /* ---------- Transitions ---------- */

  _entreeVie(tb, progressive, ensemble) {
    const S = LIEUX[this.o.lieu], nuit = this.moment === 'nuit', actifs = nuit ? S.nuit : S.jour.concat(this.atelier && this.o.lieu === 'terrain' ? [STEM_OUTIL] : []);
    const pas = progressive ? 4 : (this.vie || ensemble ? 0 : 1);          // en mesures entre deux instruments
    let k = 0;
    actifs.forEach((s) => { this._gain('vie', s, 1, tb + k * pas * this.h.dureeMesure, progressive ? 6 : 3); k++; });
    this._stemsLieu().filter((s) => !actifs.includes(s)).forEach((s) => this._gain('vie', s, 0, tb, 3));
    this._gain('vie', null, 1, tb, 0.05);
    if (!this.vie) {
      this.vie = true; this.blocsVie = 0;
      this.quotaVie = this.o.blocsVieMin + Math.floor(this.o.alea() * (this.o.blocsVieMax - this.o.blocsVieMin + 1));
      this._log(tb, 'Bloc : ' + (this.o.lieu === 'halte' || this.o.lieu === 'cooperative' ? 'l\'Exploration' : 'la Vie ' + (nuit ? 'de nuit' : '')).trim() + ' entre' + (progressive ? ', un instrument toutes les 4 mesures' : '') + '. Passage prévu : ' + this.quotaVie + ' blocs.');
    }
  }

  _tension(t, quand) {
    const at = this.h.suivant(t, quand);
    this.phase = 'tension';
    this._gain('tension', null, 1, at, 0.4);
    this._gain('danger', null, 0, at, 0.4);
    this._gain('fond', null, 1, at, 0.8);
    LIEUX[this.o.lieu].perdus.forEach((s) => this._gain('vie', s, 0, at, 1.2));
    if (this.vie) LIEUX[this.o.lieu].garde.forEach((s) => this._gain('vie', s, 0.6, at, 1.2));
    this._log(t, 'Tension (au ' + (quand === 'tempsFort' ? 'temps fort' : 'temps') + ' suivant, dans ' + (at - t).toFixed(2) + ' s). ' + (this.o.lieu === 'halte' ? 'L\'Exploration perd sa texture.' : this.o.lieu === 'cooperative' ? 'L\'Exploration perd harmonie et mélodie.' : 'La Vie perd nappes, effets et mélodie.'));
  }

  _danger(t) {
    const at = this.h.suivant(t, 'temps');
    this.phase = 'danger';
    this._gain('danger', null, 1, at, 0.03);
    this._gain('tension', null, 0, at, 0.25);
    this._stemsLieu().forEach((s) => this._gain('vie', s, 0, at, 0.25));
    this._gain('fond', null, 0.7, at, 0.25);
    this._cmds.push({ type: 'signal', nom: 'saisie', at });
    this.vie = false;
    if (this.o.lieu === 'cooperative') this._nombre(at);
    this._log(t, 'Saisie : Danger au temps suivant (dans ' + (at - t).toFixed(2) + ' s)' + (this.menace === 'nombre' ? ', avec « le nombre ».' : '.'));
  }
  /* Coopérative : le stem « nombre » du Danger suit la menace (3 Éteints ou plus), au temps */
  _nombre(at) {
    if (this.o.lieu !== 'cooperative') return;
    this._gain('danger', 'nombre', this.menace === 'nombre' ? 1 : 0, at, this.menace === 'nombre' ? 0.03 : 0.6);
  }

  _silence(t, signal) {
    const at = this.h.suivant(t, 'temps'), d = this._entre(this.o.silenceMin, this.o.silenceMax);
    this.phase = 'silence';
    ['fond', 'tension', 'danger'].forEach((c) => this._gain(c, null, 0, at, c === 'danger' ? 0.5 : 1.2));
    this._stemsLieu().forEach((s) => this._gain('vie', s, 0, at, 1.2));
    this.vie = false;
    this.finSilence = at + d;
    this.finFenetre = 0;
    if (signal) this._cmds.push({ type: 'signal', nom: signal, at });
    this._log(t, 'Fin de menace : Silence de ' + d.toFixed(1) + ' s, puis Fond.');
  }

  /* ---------- Outils ---------- */

  _stemsLieu() { const S = LIEUX[this.o.lieu]; return [...new Set(S.jour.concat(S.nuit, S.perdus, S.garde))]; }
  _gain(couche, stem, gain, at, fondu) { this._cmds.push({ type: 'gain', couche, stem, gain, at, fondu }); }
  _entre(a, b) { return a + this.o.alea() * (b - a); }
  _d(s) { return Math.round(s * this.o.echelle); }
  _log(t, msg) { this.journal.push({ t, msg }); if (this.journal.length > 200) this.journal.shift(); }
  _sortir() { const c = this._cmds; this._cmds = []; return c; }
}

/** Horloge musicale : origine t0, tempo, mesures de 4 temps, blocs de 8 mesures. */
export function creerHorloge(t0, bpm, tempsParMesure = 4, mesuresParBloc = 8) {
  const temps = 60 / bpm, mesure = temps * tempsParMesure, bloc = mesure * mesuresParBloc;
  const unites = { maintenant: 0, temps, tempsFort: temps * 2, mesure, bloc };
  return {
    t0, bpm, dureeTemps: temps, dureeMesure: mesure, dureeBloc: bloc,
    suivant(t, unite) {
      const u = unites[unite];
      if (!u) return t;
      const n = Math.ceil((t - t0) / u - 1e-6);
      return t0 + Math.max(0, n) * u;
    },
    position(t) {
      const x = Math.max(0, t - t0);
      return { bloc: Math.floor(x / bloc), mesure: Math.floor(x / mesure) % mesuresParBloc, temps: Math.floor(x / temps) % tempsParMesure };
    }
  };
}
