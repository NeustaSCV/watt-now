// Le son de la scène du cargo (0.10, K4 ; repris de la maquette validée par le porteur, .claude-travail/maquettes/cargo/) :
// la corne du paquebot (enregistrement CC0, Kinoton, Freesound 352374), le ressac, le moteur du cargo, et le fracas
// synthétisé au choc (le coup sourd, la tôle qui crie, l'écume, la coque qui casse, les conteneurs).
// Dans le jeu : le contexte audio du jeu (débloqué au premier geste), et sa sortie générale (le son coupé la coupe aussi).

/** La corne de la scène : 6 s, découpée dans le même enregistrement que la corne du large (licences.csv). */
const CORNE = ["/assets/effets-jeu/scene_cargo/corne.m4a", "/assets/effets-jeu/scene_cargo/corne.ogg"];

export class Son {
  /** `ctx` : le contexte audio du jeu ; `sortie` : où brancher la scène (la sortie générale du moteur). */
  constructor(ctx, sortie) {
    this.ctx = ctx;
    this.sortie = sortie;
    this.corne = null;
    this.actifs = [];
    this.prepare = false;
  }

  get pret() {
    return this.prepare && !!this.corne;
  }

  /** Prépare les filtres et les bruits, et charge la corne (une fois, pendant l'approche du cargo). */
  async preparer() {
    if (!this.prepare) {
      const ctx = this.ctx;
      this.maitre = ctx.createDynamicsCompressor();
      this.maitre.threshold.value = -14;
      this.maitre.ratio.value = 6;
      this.maitre.connect(this.sortie);
      this.volume = ctx.createGain();
      this.volume.gain.value = 0.9;
      this.volume.connect(this.maitre);
      // une réverbération de crique (bruit qui s'éteint en 2,6 s)
      this.reverb = ctx.createConvolver();
      const n = Math.floor(ctx.sampleRate * 2.6);
      const ir = ctx.createBuffer(2, n, ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = ir.getChannelData(c);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2);
      }
      this.reverb.buffer = ir;
      this.envoiReverb = ctx.createGain();
      this.envoiReverb.gain.value = 0.35;
      this.envoiReverb.connect(this.reverb);
      this.reverb.connect(this.volume);
      // bruits de base
      this.blanc = this.bruit(2, (d) => { for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; });
      this.brun = this.bruit(4, (d) => {
        let v = 0;
        for (let i = 0; i < d.length; i++) {
          v = (v + 0.02 * (Math.random() * 2 - 1)) / 1.02;
          d[i] = v * 3.5;
        }
      });
      this.prepare = true;
    }
    if (!this.corne) {
      for (const f of CORNE) {
        try {
          const r = await fetch(f);
          if (!r.ok) continue;
          const b = await r.arrayBuffer();
          this.corne = await new Promise((ok, ko) => this.ctx.decodeAudioData(b, ok, ko));
          break;
        } catch (e) {
          /* format non lu : on essaie le suivant */
        }
      }
    }
    return this.pret;
  }

  bruit(sec, remplir) {
    const b = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * sec), this.ctx.sampleRate);
    remplir(b.getChannelData(0));
    return b;
  }

  arreter() {
    for (const n of this.actifs) {
      try {
        n.stop();
      } catch (e) {
        /* déjà arrêté */
      }
    }
    this.actifs = [];
  }

  /** Une source (tampon) → filtres → gain, démarrée à `t` (temps du contexte). */
  source(tampon, t, { boucle = false, vitesse = 1, duree } = {}) {
    const s = this.ctx.createBufferSource();
    s.buffer = tampon;
    s.loop = boucle;
    s.playbackRate.value = vitesse;
    s.start(Math.max(t, this.ctx.currentTime), 0);
    if (duree) s.stop(Math.max(t, this.ctx.currentTime) + duree);
    this.actifs.push(s);
    return s;
  }

  enveloppe(t, attaque, pic, decroissance, apres = 0.0001) {
    const g = this.ctx.createGain();
    const t0 = Math.max(t, this.ctx.currentTime);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(pic, t0 + attaque);
    g.gain.exponentialRampToValueAtTime(apres, t0 + attaque + decroissance);
    return g;
  }

  vers(noeud, reverb = 0.5) {
    noeud.connect(this.volume);
    if (reverb) {
      const r = this.ctx.createGain();
      r.gain.value = reverb;
      noeud.connect(r);
      r.connect(this.envoiReverb);
    }
  }

  filtre(type, f, q = 0.7) {
    const b = this.ctx.createBiquadFilter();
    b.type = type;
    b.frequency.value = f;
    b.Q.value = q;
    return b;
  }

  /**
   * Joue la scène depuis `depuis` (secondes de scène). `evts` : les instants de la scène (choc, cassure…).
   */
  jouer(depuis, evts) {
    if (!this.prepare || this.ctx.state !== "running") return;
    this.arreter();
    const ctx = this.ctx;
    const t0 = ctx.currentTime - depuis + 0.05; // t0 + T = instant du contexte pour le temps de scène T
    const A = (T) => t0 + T;
    const futur = (T) => A(T) >= ctx.currentTime - 0.01;

    // Le ressac : un bruit brun filtré, qui respire
    {
      const s = this.source(this.brun, A(Math.max(depuis, 0)), { boucle: true });
      const f = this.filtre("lowpass", 520, 0.5);
      const g = ctx.createGain();
      const tDeb = Math.max(A(0), ctx.currentTime);
      g.gain.setValueAtTime(0.0001, tDeb);
      g.gain.linearRampToValueAtTime(0.28, tDeb + 0.6);
      for (let T = 1; T < evts.fin + 1; T += 1.6) g.gain.linearRampToValueAtTime(0.18 + 0.14 * Math.abs(Math.sin(T * 1.7)), A(T));
      g.gain.linearRampToValueAtTime(0.0001, A(evts.fin + 0.8));
      s.connect(f).connect(g);
      this.vers(g, 0.2);
      s.stop(A(evts.fin + 1));
    }
    // La corne : elle sonne jusqu'au choc, puis s'étrangle (la vitesse tombe avec le courant)
    if (futur(evts.choc) && this.corne) {
      const decal = Math.max(0, depuis - evts.corne);
      const s = this.ctx.createBufferSource();
      s.buffer = this.corne;
      const tDeb = Math.max(A(evts.corne), ctx.currentTime);
      s.start(tDeb, decal);
      this.actifs.push(s);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.95, tDeb);
      g.gain.setValueAtTime(0.95, A(evts.choc));
      g.gain.exponentialRampToValueAtTime(0.0001, A(evts.choc + 0.7));
      s.playbackRate.setValueAtTime(1, A(evts.choc));
      s.playbackRate.linearRampToValueAtTime(0.55, A(evts.choc + 0.6));
      s.stop(A(evts.choc + 0.8));
      s.connect(g);
      this.vers(g, 0.8);
    }
    // Le moteur du cargo : un battement grave qui monte à mesure qu'il approche, coupé à la cassure
    if (futur(evts.cassure)) {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = 36;
      const f = this.filtre("lowpass", 140, 1.2);
      const g = ctx.createGain();
      const tDeb = Math.max(A(evts.apparition), ctx.currentTime);
      g.gain.setValueAtTime(0.0001, tDeb);
      g.gain.linearRampToValueAtTime(0.32, A(evts.choc));
      g.gain.linearRampToValueAtTime(0.0001, A(evts.cassure + 0.15));
      o.frequency.setValueAtTime(36, A(evts.choc));
      o.frequency.linearRampToValueAtTime(52, A(evts.choc + 0.2));
      o.frequency.linearRampToValueAtTime(20, A(evts.cassure + 0.15));
      o.start(tDeb);
      o.stop(A(evts.cassure + 0.2));
      this.actifs.push(o);
      o.connect(f).connect(g);
      this.vers(g, 0.1);
    }
    if (futur(evts.choc)) this.fracas(A(evts.choc));
    if (futur(evts.cassure)) this.cassure(A(evts.cassure));
    for (const T of evts.plouf) if (futur(T)) this.plouf(A(T));
    for (const T of evts.clang) if (futur(T)) this.clang(A(T));
    if (futur(evts.grincement)) this.grincement(A(evts.grincement));
  }

  fracas(t) {
    const ctx = this.ctx;
    // le coup sourd : une sinusoïde qui plonge, saturée
    {
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(62, t);
      o.frequency.exponentialRampToValueAtTime(24, t + 1.4);
      const sat = ctx.createWaveShaper();
      const k = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i / 255) * 2 - 1;
        k[i] = Math.tanh(x * 3);
      }
      sat.curve = k;
      const g = this.enveloppe(t, 0.012, 1.0, 1.8);
      o.connect(sat).connect(g);
      this.vers(g, 0.4);
      o.start(t);
      o.stop(t + 2);
      this.actifs.push(o);
    }
    // l'écrasement : un éclat de bruit, puis le grondement des rochers
    {
      const s = this.source(this.blanc, t, { duree: 1 });
      const f = this.filtre("bandpass", 700, 0.6);
      const g = this.enveloppe(t, 0.005, 0.9, 0.7);
      s.connect(f).connect(g);
      this.vers(g, 0.6);
      const s2 = this.source(this.brun, t, { duree: 3 });
      const f2 = this.filtre("lowpass", 220, 0.7);
      const g2 = this.enveloppe(t, 0.03, 0.9, 2.6);
      s2.connect(f2).connect(g2);
      this.vers(g2, 0.3);
    }
    // la tôle qui crie : un bruit dans un filtre très résonant, qui glisse vers le grave
    for (const [f0, f1, v, d] of [[1500, 380, 0.35, 1.5], [2900, 900, 0.16, 1.1]]) {
      const s = this.source(this.blanc, t + 0.04, { duree: d + 0.2 });
      const f = this.filtre("bandpass", f0, 18);
      f.frequency.setValueAtTime(f0, t + 0.04);
      f.frequency.exponentialRampToValueAtTime(f1, t + 0.04 + d);
      const g = this.enveloppe(t + 0.04, 0.08, v * 3, d);
      s.connect(f).connect(g);
      this.vers(g, 0.7);
    }
    // l'écume qui retombe
    this.plouf(t + 0.08, 0.9, 1.6);
  }

  cassure(t) {
    const ctx = this.ctx;
    const s = this.source(this.blanc, t, { duree: 0.5 });
    const f = this.filtre("highpass", 260, 0.7);
    const g = this.enveloppe(t, 0.003, 0.7, 0.35);
    s.connect(f).connect(g);
    this.vers(g, 0.7);
    // le gémissement de la coque
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(78, t);
    o.frequency.exponentialRampToValueAtTime(41, t + 1.6);
    const vib = ctx.createOscillator();
    vib.frequency.value = 7;
    const vg = ctx.createGain();
    vg.gain.value = 4;
    vib.connect(vg).connect(o.frequency);
    const bp = this.filtre("bandpass", 260, 5);
    const g2 = this.enveloppe(t + 0.05, 0.25, 0.4, 1.5);
    o.connect(bp).connect(g2);
    this.vers(g2, 0.8);
    o.start(t);
    vib.start(t);
    o.stop(t + 2);
    vib.stop(t + 2);
    this.actifs.push(o, vib);
  }

  plouf(t, v = 0.55, d = 1.1) {
    const s = this.source(this.blanc, t, { duree: d + 0.3 });
    const f = this.filtre("highpass", 900, 0.5);
    const f2 = this.filtre("lowpass", 6000, 0.5);
    const g = this.enveloppe(t, 0.05, v, d);
    s.connect(f).connect(f2).connect(g);
    this.vers(g, 0.5);
  }

  clang(t) {
    const ctx = this.ctx;
    for (const [fr, v, d] of [[186, 0.4, 1.2], [471, 0.25, 0.9], [823, 0.16, 0.7], [1307, 0.1, 0.5]]) {
      const o = ctx.createOscillator();
      o.frequency.value = fr;
      const g = this.enveloppe(t, 0.004, v, d);
      o.connect(g);
      this.vers(g, 0.7);
      o.start(t);
      o.stop(t + d + 0.1);
      this.actifs.push(o);
    }
    const s = this.source(this.brun, t, { duree: 0.6 });
    const g = this.enveloppe(t, 0.01, 0.6, 0.5);
    s.connect(this.filtre("lowpass", 300)).connect(g);
    this.vers(g, 0.3);
  }

  grincement(t) {
    const s = this.source(this.blanc, t, { duree: 1.6 });
    const f = this.filtre("bandpass", 420, 25);
    f.frequency.setValueAtTime(420, t);
    f.frequency.linearRampToValueAtTime(330, t + 1.2);
    const g = this.enveloppe(t, 0.3, 0.5, 1.1);
    s.connect(f).connect(g);
    this.vers(g, 0.9);
  }
}
