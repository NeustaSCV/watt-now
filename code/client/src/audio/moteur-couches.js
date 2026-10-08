/* Watt Now? — moteur audio en couches (Book 21 §6.4.1).
   Module ES sans dépendance, prévu pour être branché dans le client (code/).

   AudioContext (un seul, débloqué au bouton « Jouer »)
    ├─ Bus menaces (P1)        ┐
    ├─ Bus joueur (P2)         ├─ réglage « effets »
    ├─ Bus environnement (P3)  ─ réglage « ambiance »
    ├─ Bus musique (P4)        ─ réglage « musique »  ← atténué par P1 et P2
    ├─ Bus interface           ─ réglage « effets »
    └─ Bus voix (réservé)      ─ réglage « voix »
           → maître (« général ») → limiteur → sortie

   Musique : des pièces en blocs de 8 mesures, un AudioBuffer par stem et par bloc (+ 1 mesure de queue).
   Tous les stems d'un bloc démarrent au même instant sur l'horloge de l'AudioContext ; une couche se coupe
   par son volume, jamais en l'arrêtant. Le directeur (directeur.js) décide des volumes ; le moteur les applique.
   Effets : jamais calés sur le tempo. Variation de hauteur ±3 %, de volume ±2 dB ; position et portée de signature. */

import { Directeur, creerHorloge, STEMS_VIE } from './directeur.js';

const COUCHES = ['fond', 'vie', 'tension', 'danger'];

export class MoteurAudio {
  constructor(ctx, options) {
    this.ctx = ctx;
    this.o = Object.assign({ bpm: 84, anticipation: 1.0, periode: 50, voixMax: 48, duck: { p1: -9, p2: -6, attaque: 0.08, retour: 1.5 } }, options || {});

    /* --- Bus et réglages --- */
    const g = (v) => { const n = ctx.createGain(); n.gain.value = v; return n; };
    this.limiteur = ctx.createDynamicsCompressor();
    this.limiteur.threshold.value = -2; this.limiteur.knee.value = 0; this.limiteur.ratio.value = 20;
    this.limiteur.attack.value = 0.002; this.limiteur.release.value = 0.12;
    this.maitre = g(1);
    this.maitre.connect(this.limiteur); this.limiteur.connect(ctx.destination);
    this.reglages = { general: this.maitre, musique: g(1), effets: g(1), ambiance: g(1), voix: g(1) };
    ['musique', 'effets', 'ambiance', 'voix'].forEach((k) => this.reglages[k].connect(this.maitre));
    this.duckMusique = g(1); this.duckEnv = g(1);
    this.bus = {
      menaces: g(1), joueur: g(1), environnement: g(1), musique: g(1), interface: g(1), voix: g(1)
    };
    this.bus.menaces.connect(this.reglages.effets);
    this.bus.joueur.connect(this.reglages.effets);
    this.bus.interface.connect(this.reglages.effets);
    this.bus.environnement.connect(this.duckEnv); this.duckEnv.connect(this.reglages.ambiance);
    /* La radio (Comptoir, Book 21 §6.1.1) : un filtre sur le bus musique, ouvert par défaut ; fermé, la musique sort d'un petit poste */
    this.radioHP = ctx.createBiquadFilter(); this.radioHP.type = 'highpass'; this.radioHP.frequency.value = 10;
    this.radioLP = ctx.createBiquadFilter(); this.radioLP.type = 'lowpass'; this.radioLP.frequency.value = 20000;
    this.bus.musique.connect(this.radioHP); this.radioHP.connect(this.radioLP); this.radioLP.connect(this.duckMusique); this.duckMusique.connect(this.reglages.musique);
    this.bus.voix.connect(this.reglages.voix);

    /* --- Couches musicales : couche → stems --- */
    this.couches = {};
    COUCHES.forEach((c) => {
      const n = g(0); n.connect(this.bus.musique);
      this.couches[c] = { gain: n, stems: {}, piece: null, pieceSuivante: null, dernierBloc: -1 };
    });
    this.pieces = {};
    this.signaux = {};
    this.voix = [];          // effets en cours, pour la limite de voix
    this.timer = null;
    this.ecouteurs = [];
  }

  /* ---------- Contenu ---------- */

  /**
   * piece : { stems: [noms], blocs: [{ nomDuStem: entrée }] } ; tous les blocs durent 8 mesures + queue.
   * Une entrée est soit un AudioBuffer (pièces rendues en direct), soit { donnees: ArrayBuffer compressé, buffer: null }
   * (fichiers produits) : décodée juste à temps, libérée ensuite (Book 21 §6.4.4).
   * Version mobile : une pièce n'a qu'un stem « mix » (prémixé) et la liste stemsPrémixés.
   */
  chargerPiece(id, piece) { this.pieces[id] = piece; }
  chargerSignal(nom, entree) { this.signaux[nom] = entree; }
  /** Pièce jouée par une couche (au démarrage, ou à la frontière de bloc suivante si la musique tourne) */
  attribuer(couche, idPiece) {
    const c = this.couches[couche];
    if (!this.timer) { c.piece = idPiece; this._stemsDe(couche, idPiece); }
    else this._changerPiece(couche, idPiece);
  }
  _stemsDe(couche, idPiece) {
    const c = this.couches[couche], p = this.pieces[idPiece];
    if (!p) return;
    p.stems.forEach((s) => { if (!c.stems[s]) { const n = this.ctx.createGain(); n.gain.value = couche === 'vie' && s !== 'mix' ? 0 : 1; n.connect(c.gain); c.stems[s] = n; } });
    /* Version mobile : seule la Vie est réglée stem par stem par le directeur (stems « virtuels » → volume du prémix) ;
       Fond, Tension et Danger sont réglés en bloc (volume de la couche) : leur prémix joue à plein volume. */
    if (p.stems.includes('mix')) { const vie = couche === 'vie'; c.stems.mix.gain.value = vie ? 0 : 1; c.mobile = vie; }
  }

  /**
   * Charge les pièces produites (musique/production/) d'après le manifeste, comme le fera le jeu.
   * Les fichiers restent COMPRESSÉS en mémoire ; seuls les blocs utiles sont décodés (bloc en cours + suivant).
   * Opus si le navigateur le lit, sinon AAC (.m4a). mobile : la version prémixée (3 couches). Famille du joueur seulement.
   */
  async chargerProduction(base, famille, progres, mobile) {
    const man = await (await fetch(base + (mobile ? 'manifeste-mobile.json' : 'manifeste.json'))).json();
    const dossier = base + (mobile ? 'mobile/' : 'jeu/');
    const opus = typeof Audio !== 'undefined' && new Audio().canPlayType('audio/ogg; codecs="opus"') !== '';
    const ext = opus ? '.opus' : '.m4a';
    const taches = [];
    let octets = 0;
    const lire = async (f) => { const r = await fetch(dossier + f + ext); if (!r.ok) throw new Error('fichier manquant : ' + dossier + f + ext); const d = await r.arrayBuffer(); octets += d.byteLength; return { donnees: d, buffer: null }; };
    const garder = (nom) => !nom.startsWith('vie-') || nom.endsWith('-' + famille);
    Object.entries(man.pieces).filter(([nom]) => garder(nom)).forEach(([nom, p]) => {
      const id = nom.startsWith('vie-') ? nom.slice(0, nom.length - famille.length - 1) : nom;   // « vie-jour-atelier-charbonniers » → « vie-jour-atelier »
      const piece = { stems: p.stems, stemsPrémixés: p.stemsPrémixés, blocs: p.blocs.map(() => ({})) };
      this.chargerPiece(id, piece);
      p.blocs.forEach((stems, b) => Object.entries(stems).forEach(([stem, f]) => taches.push(async () => { piece.blocs[b][stem] = await lire(f); })));
    });
    Object.entries(man.signaux).forEach(([nom, f]) => {
      if (nom.startsWith('feu-') && nom !== 'feu-' + famille) return;
      taches.push(async () => this.chargerSignal(nom.startsWith('feu-') ? 'feu' : nom, await lire(f)));
    });
    let fait = 0;
    const file = taches.slice();
    await Promise.all([1, 2, 3, 4].map(async () => { while (file.length) { await file.shift()(); fait++; if (progres) progres(fait, taches.length); } }));
    /* Signaux qui doivent partir sans délai (saisie : au temps suivant, ≤ 0,7 s) : décodés d'avance */
    await Promise.all(['saisie', 'degagement'].map((n) => this._decoderEntree(this.signaux[n])));
    this.mobile = !!mobile;
    return { format: ext.slice(1), fichiers: taches.length, compresseMo: octets / 1048576, manifeste: man };
  }

  /* ---------- Décodage juste à temps ---------- */

  _buffer(e) { return !e ? null : (typeof AudioBuffer !== 'undefined' && e instanceof AudioBuffer) ? e : e.buffer; }
  _decoderEntree(e) {
    if (!e || this._buffer(e)) return Promise.resolve();
    if (!e.promesse) e.promesse = this.ctx.decodeAudioData(e.donnees.slice(0)).then((b) => { e.buffer = b; e.promesse = null; });
    return e.promesse;
  }
  _liberer(e) { if (e && e.donnees) e.buffer = null; }
  /* Le directeur dit quels stems décoder et lancer : l'atelier, et à la coopérative la zone, l'Exploration (dehors), « le nombre » */
  _stemUtile(stem, couche) { return this.directeur ? this.directeur.stemUtile(couche, stem) : stem !== 'outil'; }
  _choisir(idPiece, exclu) {
    const p = this.pieces[idPiece]; if (!p) return 0;
    let i = Math.floor(Math.random() * p.blocs.length);
    if (p.blocs.length > 1 && i === exclu) i = (i + 1) % p.blocs.length;     // jamais deux fois le même bloc de suite
    return i;
  }
  _actif(couche) { const c = this.couches[couche]; return couche === 'fond' || couche === 'vie' || c.cible > 0 || c.gain.gain.value > 0.001; }
  /** Garde décodés : bloc en cours, bloc suivant, bloc préchauffé (changement de pièce) ; libère tout le reste */
  _entretenir(couche) {
    const c = this.couches[couche], garder = [c.courant, c.prochain, c.prechauffe].filter(Boolean);
    const pieces = new Set(garder.map((g) => g.piece).concat(c.piece ? [c.piece] : []));
    pieces.forEach((id) => {
      const p = this.pieces[id]; if (!p) return;
      p.blocs.forEach((bloc, b) => {
        const utile = garder.some((g) => g.piece === id && g.b === b);
        Object.entries(bloc).forEach(([stem, e]) => { if (utile && this._stemUtile(stem, couche)) this._decoderEntree(e); else this._liberer(e); });
      });
    });
  }
  /** Préchauffe le premier bloc d'une pièce qui va bientôt remplacer celle de la couche (nuit, jour, atelier en mobile) */
  _changerPiece(couche, idPiece) {
    const c = this.couches[couche];
    if (!this.pieces[idPiece] || c.piece === idPiece) return;
    c.pieceSuivante = idPiece;
    c.prechauffe = { piece: idPiece, b: this._choisir(idPiece, -1) };
    if (c.prochain && c.prochain.piece !== idPiece) c.prochain = null;    // le bloc suivant de l'ancienne pièce ne servira pas
    this._entretenir(couche);
  }
  /** Mémoire audio décodée (Mo) : ce qui compte pour le budget (≤ 160 Mo ordinateur, ≤ 64 Mo mobile) */
  memoire() {
    let o = 0;
    const compter = (e) => { const b = this._buffer(e); if (b) o += b.length * b.numberOfChannels * 4; };
    Object.values(this.pieces).forEach((p) => p.blocs.forEach((bloc) => Object.values(bloc).forEach(compter)));
    Object.values(this.signaux).forEach(compter);
    return o / 1048576;
  }

  /* ---------- Lecture ---------- */

  async demarrer() {
    const ctx = this.ctx;
    this.horloge = creerHorloge(ctx.currentTime + 0.3, this.o.bpm);
    this.directeur = new Directeur(this.horloge, this.o.directeur);
    /* Premier bloc de chaque couche décodé avant de partir */
    await Promise.all(COUCHES.map((couche) => {
      const c = this.couches[couche]; if (!c.piece) return null;
      c.prochain = { piece: c.piece, b: this._choisir(c.piece, -1) };
      this._entretenir(couche);
      return Promise.all(Object.entries(this.pieces[c.piece].blocs[c.prochain.b]).filter(([s]) => this._stemUtile(s, couche)).map(([, e]) => this._decoderEntree(e)));
    }));
    this.horloge = creerHorloge(ctx.currentTime + 0.3, this.o.bpm);
    this.directeur.h = this.horloge;
    this.prochainBloc = this.horloge.t0;
    this._appliquer(this.directeur.demarrer(ctx.currentTime));
    const tic = () => this._tic();
    tic();
    this.timer = setInterval(tic, this.o.periode);
  }

  arreter() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    const now = this.ctx.currentTime;
    COUCHES.forEach((c) => { this.couches[c].gain.gain.cancelScheduledValues(now); this.couches[c].gain.gain.setTargetAtTime(0, now, 0.3); });
    (this.sources || []).forEach((s) => { try { s.stop(now + 1.5); } catch (e) {} });
    this.sources = [];
  }

  _tic() {
    const now = this.ctx.currentTime;
    /* Programmer les blocs en avance (anticipation large : les minuteurs sont ralentis sur mobile et en arrière-plan) */
    while (this.prochainBloc < now + this.o.anticipation) {
      const tb = this.prochainBloc;
      this._appliquer(this.directeur.avantBloc(tb));
      COUCHES.forEach((c) => this._programmerBloc(c, tb));
      this.prochainBloc += this.horloge.dureeBloc;
    }
    this._appliquer(this.directeur.mettreAJour(now));
    COUCHES.forEach((c) => this._rattraper(c, now));
    this.ecouteurs.forEach((f) => f(now));
  }

  _programmerBloc(couche, tb) {
    const c = this.couches[couche];
    if (c.pieceSuivante) {
      const ancienne = c.piece;
      c.piece = c.pieceSuivante; c.pieceSuivante = null; this._stemsDe(couche, c.piece);
      if (ancienne && ancienne !== c.piece && this.pieces[ancienne]) this.pieces[ancienne].blocs.forEach((bloc) => Object.values(bloc).forEach((e) => this._liberer(e)));
      if (c.prechauffe && c.prechauffe.piece === c.piece) c.prochain = c.prechauffe;
      c.prechauffe = null;
      if (c.mobile) this._mixMobile(couche, tb);
    }
    const p = this.pieces[c.piece];
    if (!p || !p.blocs.length) return;
    const plan = c.prochain && c.prochain.piece === c.piece ? c.prochain : { piece: c.piece, b: this._choisir(c.piece, c.courant ? c.courant.b : -1) };
    c.courant = Object.assign({ tb, programmes: new Set() }, plan);
    c.blocCourant = plan.b;
    this.sources = (this.sources || []).filter((s) => s.fin > this.ctx.currentTime);
    Object.entries(p.blocs[plan.b]).forEach(([stem, e]) => { if (this._lancer(couche, stem, e, tb, 0)) c.courant.programmes.add(stem); });
    /* Bloc suivant : choisi maintenant et décodé pendant que celui-ci joue. Tension et Danger répètent leur bloc
       (un seul bloc décodé chacun, tiré au hasard au démarrage) : ils durent rarement plus d'un bloc,
       et c'est ce qui tient le budget mémoire. */
    const repeter = couche === 'tension' || couche === 'danger';
    c.prochain = repeter ? { piece: plan.piece, b: plan.b } : { piece: c.piece, b: this._choisir(c.piece, plan.b) };
    this._entretenir(couche);
  }
  _lancer(couche, stem, e, tb, decalage) {
    const c = this.couches[couche], buf = this._buffer(e);
    if (!c.stems[stem] || !buf || !this._stemUtile(stem, couche)) return false;
    const src = this.ctx.createBufferSource();
    src.buffer = buf; src.connect(c.stems[stem]);
    src.start(tb + decalage, decalage); src.fin = tb + buf.duration;
    this.sources.push(src);
    return true;
  }
  /* Un stem pas prêt au début du bloc (décodage en retard, ou l'atelier vient d'être installé) : on le lance dès qu'il l'est,
     à la bonne position dans le bloc, pour qu'il reste parfaitement synchronisé */
  _rattraper(couche, now) {
    const c = this.couches[couche], cour = c.courant;
    if (!cour || now < cour.tb) return;
    const p = this.pieces[cour.piece]; if (!p) return;
    Object.entries(p.blocs[cour.b]).forEach(([stem, e]) => {
      if (cour.programmes.has(stem) || !this._buffer(e) || !this._stemUtile(stem, couche)) return;
      const decalage = now + 0.05 - cour.tb;
      if (decalage < this._buffer(e).duration - 1 && this._lancer(couche, stem, e, cour.tb, decalage)) cour.programmes.add(stem);
    });
  }

  _appliquer(cmds) {
    cmds.forEach((cmd) => {
      if (cmd.type === 'gain') {
        const c = this.couches[cmd.couche];
        if (!cmd.stem) c.cible = cmd.gain;
        if (cmd.stem && c.mobile) { this._virtuel(cmd); return; }
        /* Stem pas encore chargé (ex. la mélodie de la Vie de nuit) : on crée son volume tout de suite, pour ne pas perdre l'ordre */
        if (cmd.stem && !c.stems[cmd.stem]) { const n = this.ctx.createGain(); n.gain.value = 0; n.connect(c.gain); c.stems[cmd.stem] = n; }
        const nodes = cmd.stem ? [c.stems[cmd.stem]] : [c.gain];
        nodes.forEach((n) => {
          if (!n) return;
          const p = n.gain, at = Math.max(cmd.at, this.ctx.currentTime);
          p.cancelScheduledValues(at);
          p.setTargetAtTime(cmd.gain, at, Math.max(0.01, cmd.fondu / 3));
        });

      } else if (cmd.type === 'piece') {
        let id = cmd.piece;
        if (this.mobile && id === 'vie-jour' && this.directeur.atelier && this.pieces['vie-jour-atelier']) id = 'vie-jour-atelier';
        this.couches[cmd.couche].pieceSuivante = id;
      } else if (cmd.type === 'signal') {
        const e = this.signaux[cmd.nom];
        if (!e) return;
        this._decoderEntree(e).then(() => {
          const s = this.ctx.createBufferSource(); s.buffer = this._buffer(e); s.connect(this.bus.musique);
          s.start(Math.max(cmd.at, this.ctx.currentTime + 0.02));
          if (!['saisie', 'degagement'].includes(cmd.nom)) s.onended = () => this._liberer(e);
        });
      }
    });
  }

  /* ---------- Mobile : les ordres du directeur visent des stems ; un prémix n'en a qu'un ----------
     Le volume du « mix » suit la moyenne des stems virtuels qui le composent : quand la Vie perd harmonie et effets
     en Tension, le mix baisse ; l'entrée instrument par instrument devient un crescendo en 4 marches. */
  _virtuel(cmd) {
    const c = this.couches[cmd.couche];
    c.virtuels = c.virtuels || {};
    const v = (c.virtuels[cmd.stem] = (c.virtuels[cmd.stem] || []).filter((x) => x.at < cmd.at));
    v.push({ at: cmd.at, gain: cmd.gain, fondu: cmd.fondu });
    if (cmd.stem === 'outil' && cmd.gain > 0 && this.pieces['vie-jour-atelier'] && this.couches.vie.piece === 'vie-jour') this._changerPiece('vie', 'vie-jour-atelier');
    this._mixMobile(cmd.couche, cmd.at);
  }
  _mixMobile(couche, depuis) {
    const c = this.couches[couche], p = this.pieces[c.pieceSuivante || c.piece];
    if (!c.stems.mix || !p) return;
    const liste = p.stemsPrémixés || [];
    const valeur = (t) => liste.reduce((s, st) => { const v = (c.virtuels && c.virtuels[st]) || []; const d = v.filter((x) => x.at <= t + 1e-6).pop(); return s + (d ? d.gain : 0); }, 0) / Math.max(1, liste.length);
    const instants = [...new Set([depuis].concat(...Object.values(c.virtuels || {}).map((v) => v.filter((x) => x.at >= depuis).map((x) => x.at))))].sort((a, b) => a - b);
    const g = c.stems.mix.gain, now = this.ctx.currentTime;
    g.cancelScheduledValues(Math.max(depuis, now));
    instants.forEach((t) => {
      const fondu = Math.max(0.05, ...Object.values(c.virtuels || {}).map((v) => (v.find((x) => Math.abs(x.at - t) < 1e-6) || { fondu: 0 }).fondu));
      g.setTargetAtTime(valeur(t), Math.max(t, now), fondu / 3);
    });
  }

  /* ---------- Écran titre : le réveil et le thème principal (moment-vitrine 1) ----------
     Toujours la version prémixée (un seul fichier stéréo par partie), sur ordinateur comme sur mobile :
     l'introduction (jingle, coupure, thème jusqu'à la mesure 44), puis la boucle (8 mesures) relancée sans fin,
     chaque reprise chevauchant la queue de la précédente. quitterTitre() : fondu, puis le jeu charge le lieu. */
  async jouerTitre(base) {
    const man = await (await fetch(base + 'manifeste-mobile.json')).json(), p = man.pieces.titre;
    const opus = typeof Audio !== 'undefined' && new Audio().canPlayType('audio/ogg; codecs="opus"') !== '';
    const lire = async (f) => this.ctx.decodeAudioData(await (await fetch(base + 'mobile/' + f + (opus ? '.opus' : '.m4a'))).arrayBuffer());
    const [intro, boucle] = await Promise.all([lire(p.blocs[0].mix), lire(p.blocs[1].mix)]);
    const M = 240 / p.bpm, t0 = this.ctx.currentTime + 0.1, sortie = this.ctx.createGain();
    sortie.connect(this.bus.musique);
    const titre = { sortie, sources: [], timer: null };
    const lancer = (buf, t) => { const s = this.ctx.createBufferSource(); s.buffer = buf; s.connect(sortie); s.start(t); titre.sources.push(s); };
    lancer(intro, t0);
    let prochaine = t0 + 44 * M;
    const tic = () => { while (prochaine < this.ctx.currentTime + 2) { lancer(boucle, prochaine); prochaine += 8 * M; } titre.sources = titre.sources.slice(-3); };
    tic(); titre.timer = setInterval(tic, 250);
    this.titre = titre;
    return { dureeIntro: 44 * M, dureeBoucle: 8 * M };
  }
  quitterTitre(fondu = 5) {
    const T = this.titre; if (!T) return;
    clearInterval(T.timer);
    const now = this.ctx.currentTime;
    T.sortie.gain.setValueAtTime(T.sortie.gain.value, now); T.sortie.gain.linearRampToValueAtTime(0, now + fondu);
    T.sources.forEach((s) => { try { s.stop(now + fondu + 0.1); } catch (e) {} });
    this.titre = null;
  }

  /* ---------- État du jeu → directeur ---------- */

  signalerMenace(niveau) { this._appliquer(this.directeur.signalerMenace(niveau, this.ctx.currentTime)); this._entretenir('danger'); }
  /** Coopérative : le joueur passe une porte ('dehors' | 'dedans' | 'froid'). Le stem de la zone est décodé tout de suite
      et lancé dans le bloc en cours, bien calé (rattrapage) ; il monte à la mesure suivante. */
  changerZone(zone) { this._appliquer(this.directeur.changerZone(zone, this.ctx.currentTime)); COUCHES.forEach((c) => this._entretenir(c)); }
  dormir() { this._appliquer(this.directeur.dormir(this.ctx.currentTime)); }
  premierFeu() { this._appliquer(this.directeur.premierFeu(this.ctx.currentTime)); }
  installerAtelier() {
    this._appliquer(this.directeur.installerAtelier(this.ctx.currentTime));
    this._entretenir('vie');                                   // la percussion de l'atelier est décodée maintenant (puis rattrapée dans le bloc)
  }
  reveiller() { this._prechaufferMoment('jour'); this._appliquer(this.directeur.reveiller(this.ctx.currentTime)); }
  changerMoment(moment) { this._prechaufferMoment(moment); this._appliquer(this.directeur.changerMoment(moment, this.ctx.currentTime)); }
  /* Jour ou nuit : la musique change au prochain bloc ; on décode son premier bloc dès maintenant */
  _prechaufferMoment(moment) {
    const nuit = moment === 'nuit';
    this._changerPiece('fond', nuit ? 'fond-nuit' : 'fond-jour');
    this._changerPiece('vie', nuit ? 'vie-nuit' : (this.mobile && this.directeur.atelier && this.pieces['vie-jour-atelier'] ? 'vie-jour-atelier' : 'vie-jour'));
    ['fond', 'vie'].forEach((c) => { this.couches[c].pieceSuivante = null; });   // c'est le directeur qui fixe l'instant (frontière de bloc)
  }
  /** Signal déclenché par le jeu (recette, decouverte, echange, mort, eteintRepere…) : à la mesure, au temps, ou tout de suite */
  jouerSignal(nom, quand = 'temps') {
    const now = this.ctx.currentTime;
    this._appliquer([{ type: 'signal', nom, at: this.horloge && quand !== 'maintenant' ? this.horloge.suivant(now, quand) : now }]);
  }
  /** radio(true) : la musique sort d'un petit poste (bande étroite, plus bas) ; radio(false) : elle s'ouvre en grand (fondu en s) */
  radio(actif, fondu = 1.5) {
    const now = this.ctx.currentTime, tau = fondu / 3;
    this.radioHP.frequency.setTargetAtTime(actif ? 450 : 10, now, tau);
    this.radioLP.frequency.setTargetAtTime(actif ? 2800 : 20000, now, tau);
    this.reglages.musique.gain.setTargetAtTime(actif ? 0.45 : 1, now, tau);
  }
  regler(nom, valeur) { const n = this.reglages[nom]; if (n) n.gain.setTargetAtTime(valeur, this.ctx.currentTime, 0.05); }

  /* ---------- Effets ---------- */

  /**
   * Joue un effet tout de suite (jamais calé sur le tempo).
   * o : { bus: 'menaces'|'joueur'|'environnement'|'interface', priorite: 1|2|3, gain, position: {x, y} (m, x à droite, y devant),
   *       portee (m) : au-delà, inaudible ; varier: true (±3 % hauteur, ±2 dB) }
   */
  jouerEffet(buffer, o) {
    o = Object.assign({ bus: 'joueur', priorite: 2, gain: 1, position: null, portee: 0, varier: true, boucle: false, fondu: 0 }, o || {});
    const ctx = this.ctx, now = ctx.currentTime;
    let gain = o.gain, pan = 0, coupure = 20000;
    if (o.position && o.portee) {
      const d = Math.hypot(o.position.x, o.position.y);
      if (d >= o.portee) return null;                           // hors de la portée de signature : inaudible
      const r = d / o.portee;
      gain *= Math.pow(1 - r, 1.6);                             // s'éteint exactement à la portée
      pan = Math.max(-1, Math.min(1, o.position.x / Math.max(1, d)));
      coupure = 18000 - 14000 * r;
      if (o.position.y < 0) coupure = Math.min(coupure, 3500);  // derrière : plus sourd
    }
    if (o.varier) gain *= Math.pow(10, (Math.random() * 4 - 2) / 20);
    this._limiterVoix(o.priorite);
    const src = ctx.createBufferSource(); src.buffer = buffer;
    if (o.varier) src.playbackRate.value = 1 + (Math.random() * 0.06 - 0.03);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = coupure;
    const g = ctx.createGain(); g.gain.value = gain;
    if (o.fondu) { g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(gain, now + o.fondu); }
    if (o.boucle) { src.loop = true; if (buffer.finBoucle) src.loopEnd = buffer.finBoucle; }   // son continu (feu, machine) : à arrêter avec arreterEffet
    const p = ctx.createStereoPanner(); p.pan.value = pan;
    src.connect(lp); lp.connect(g); g.connect(p); p.connect(this.bus[o.bus]);
    src.start(now);
    const v = { src, gain: g, priorite: o.priorite, fin: o.boucle ? Infinity : now + buffer.duration / src.playbackRate.value };
    this.voix.push(v);
    if (o.priorite <= 2 && gain > 0.12) this._duck(o.priorite);   // un son presque inaudible (au bord de sa portée) ne baisse pas la musique
    return v;
  }

  /** Arrête un effet (en boucle ou non) avec un fondu */
  arreterEffet(v, fondu = 1) {
    if (!v) return;
    const now = this.ctx.currentTime;
    v.gain.gain.cancelScheduledValues(now); v.gain.gain.setValueAtTime(v.gain.gain.value, now); v.gain.gain.linearRampToValueAtTime(0, now + fondu);
    try { v.src.stop(now + fondu + 0.05); } catch (e) {}
    v.fin = now + fondu;
  }

  /* Trop de voix : on coupe d'abord P3, jamais P1 */
  _limiterVoix(priorite) {
    const now = this.ctx.currentTime;
    this.voix = this.voix.filter((v) => v.fin > now);
    while (this.voix.length >= this.o.voixMax) {
      const cand = this.voix.filter((v) => v.priorite === 3).concat(this.voix.filter((v) => v.priorite === 2 && priorite === 1));
      if (!cand.length) break;
      const v = cand[0]; try { v.src.stop(); } catch (e) {}
      this.voix.splice(this.voix.indexOf(v), 1);
    }
  }

  /* Atténuation par événements : P1 ou P2 baisse la musique (attaque 80 ms, retour 1,5 s) ; P1 baisse aussi l'environnement de 4 dB */
  _duck(priorite) {
    const now = this.ctx.currentTime, d = this.o.duck;
    const cible = Math.pow(10, (priorite === 1 ? d.p1 : d.p2) / 20);
    const m = this.duckMusique.gain;
    m.cancelScheduledValues(now); m.setTargetAtTime(Math.min(cible, m.value), now, d.attaque / 3); m.setTargetAtTime(1, now + 0.4, d.retour / 3);
    if (priorite === 1) {
      const e = this.duckEnv.gain;
      e.cancelScheduledValues(now); e.setTargetAtTime(Math.pow(10, -4 / 20), now, d.attaque / 3); e.setTargetAtTime(1, now + 0.4, d.retour / 3);
    }
  }

  /* ---------- Lecture de l'état (pour l'interface de test) ---------- */

  etat() {
    const now = this.ctx.currentTime, pos = this.horloge ? this.horloge.position(now) : null;
    const couches = {};
    COUCHES.forEach((c) => {
      const C = this.couches[c];
      couches[c] = { gain: C.gain.gain.value, piece: C.piece, bloc: C.blocCourant, stems: Object.fromEntries(Object.entries(C.stems).map(([k, n]) => [k, n.gain.value])) };
    });
    return { now, pos, memoire: this.memoire(), mobile: !!this.mobile, phase: this.directeur && this.directeur.phase, moment: this.directeur && this.directeur.moment, menace: this.directeur && this.directeur.menace, couches, duck: this.duckMusique.gain.value, journal: this.directeur ? this.directeur.journal : [] };
  }
}

export { STEMS_VIE };
