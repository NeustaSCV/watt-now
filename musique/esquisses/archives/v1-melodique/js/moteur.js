/* Watt Now? — moteur des esquisses musicales (phase 0a, étape 2).
   Synthèse Web Audio uniquement : aucun fichier externe.
   Le même code sert à la lecture en direct et au rendu hors ligne (export WAV). */
(function () {
  'use strict';

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ---------- Bruit et réverbération ---------- */

  const noiseCache = new WeakMap();
  function noiseBuffer(ctx) {
    if (noiseCache.has(ctx)) return noiseCache.get(ctx);
    const len = ctx.sampleRate * 2;
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    noiseCache.set(ctx, b);
    return b;
  }

  function impulse(ctx, seconds, decay, bright) {
    const sr = ctx.sampleRate, len = Math.floor(sr * seconds);
    const b = ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const t = i / len;
        const n = Math.random() * 2 - 1;
        lp += (n - lp) * (bright * (1 - t) + 0.05);
        d[i] = lp * Math.pow(1 - t, decay);
      }
      [0.011, 0.019, 0.027, 0.041].forEach((er, k) => {
        const idx = Math.floor((er + ch * 0.003) * sr);
        if (idx < len) d[idx] += 0.5 / (k + 1);
      });
    }
    return b;
  }

  /* ---------- Graphe : maître, réverbération, écho, couches ---------- */

  function buildGraph(ctx, opts) {
    const o = Object.assign({ verbSeconds: 2.6, verbDecay: 3, verbBright: 0.5, verbWet: 0.28, delay: 0, delayFb: 0.3 }, opts || {});
    const master = ctx.createGain();
    master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 8; comp.ratio.value = 3.5;
    comp.attack.value = 0.01; comp.release.value = 0.25;
    const out = ctx.createGain(); out.gain.value = 0.95;
    /* Écrêtage doux final : garantit une crête < 1 sans toucher aux signaux faibles */
    const clip = ctx.createWaveShaper(); const cc = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = (i / 1023) * 2 - 1; cc[i] = 0.97 * Math.tanh(x * 1.6 / 0.97) / Math.tanh(1.6 / 0.97); }
    clip.curve = cc;
    master.connect(comp); comp.connect(out); out.connect(clip); clip.connect(ctx.destination);

    const verb = ctx.createConvolver();
    verb.buffer = impulse(ctx, o.verbSeconds, o.verbDecay, o.verbBright);
    const verbIn = ctx.createGain(); verbIn.gain.value = o.verbWet;
    const verbHp = ctx.createBiquadFilter(); verbHp.type = 'highpass'; verbHp.frequency.value = 180;
    verbIn.connect(verbHp); verbHp.connect(verb); verb.connect(master);

    let delayIn = null;
    if (o.delay > 0) {
      delayIn = ctx.createGain(); delayIn.gain.value = 0.25;
      const dl = ctx.createDelay(2); dl.delayTime.value = o.delay;
      const fb = ctx.createGain(); fb.gain.value = o.delayFb;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
      const pan = ctx.createStereoPanner(); pan.pan.value = 0.45;
      delayIn.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl);
      lp.connect(pan); pan.connect(master); pan.connect(verbIn);
    }

    /* Chaque couche : interrupteur (layers) → niveau de mixage fixe (trim) → maître */
    const layers = {}, trim = o.trim || {};
    ['fond', 'rythmique', 'basse', 'harmonie', 'melodie'].forEach((name) => {
      const g = ctx.createGain();
      g.gain.value = 1;
      const tr = ctx.createGain();
      tr.gain.value = trim[name] || 1;
      g.connect(tr); tr.connect(master);
      layers[name] = g;
    });
    return { master, out, verbIn, delayIn, layers };
  }

  /* Une voix : panoramique + envoi réverbération (+ écho) */
  function voiceOut(ctx, G, layer, pan, send, echo) {
    const g = ctx.createGain();
    const p = ctx.createStereoPanner(); p.pan.value = pan || 0;
    g.connect(p); p.connect(G.layers[layer]);
    if (send) { const s = ctx.createGain(); s.gain.value = send; p.connect(s); s.connect(G.verbIn); }
    if (echo && G.delayIn) { const e = ctx.createGain(); e.gain.value = echo; p.connect(e); e.connect(G.delayIn); }
    return g;
  }

  /* Enveloppe simple et sûre : attaque, déclin vers un palier, relâchement à la fin. */
  function adsr(g, t, a, peak, d, sus, end, rel) {
    const p = g.gain;
    p.setValueAtTime(0.0001, t);
    p.linearRampToValueAtTime(peak, t + a);
    p.setTargetAtTime(Math.max(0.0001, peak * sus), t + a, Math.max(0.005, d / 3));
    p.setTargetAtTime(0.0001, Math.max(end, t + a + 0.01), Math.max(0.005, rel / 4));
  }

  /* ---------- Cordes pincées : Karplus-Strong ---------- */

  const ksCache = new Map();
  function ksBuffer(ctx, freq, seconds, bright, decay, variant) {
    const key = ctx.sampleRate + ':' + freq.toFixed(2) + ':' + seconds + ':' + bright + ':' + decay + ':' + variant;
    if (ksCache.has(key)) return ksCache.get(key);
    const sr = ctx.sampleRate, N = Math.max(2, Math.round(sr / freq)), L = Math.floor(sr * seconds);
    const b = ctx.createBuffer(1, L, sr), d = b.getChannelData(0), line = new Float32Array(N);
    let prev = 0;
    for (let i = 0; i < N; i++) { const n = Math.random() * 2 - 1; prev += (n - prev) * (0.15 + bright * 0.85); line[i] = prev; }
    let idx = 0;
    for (let i = 0; i < L; i++) {
      const cur = line[idx], nxt = line[(idx + 1) % N];
      d[i] = cur;
      line[idx] = decay * (0.5 * (cur + nxt));
      idx = (idx + 1) % N;
    }
    ksCache.set(key, b);
    return { buffer: b, rate: N / (sr / freq) };
  }
  function pluck(ctx, G, layer, t, midi, dur, vel, o) {
    o = Object.assign({ bright: 0.5, decay: 0.996, len: 2.5, pan: 0, send: 0.25, gain: 0.5, body: 0 }, o || {});
    const f = mtof(midi);
    let r = ksBuffer(ctx, f, o.len, o.bright, o.decay, Math.floor(Math.random() * 3));
    if (r instanceof AudioBuffer) r = { buffer: r, rate: Math.max(2, Math.round(ctx.sampleRate / f)) / (ctx.sampleRate / f) };
    const src = ctx.createBufferSource(); src.buffer = r.buffer; src.playbackRate.value = r.rate;
    const g = voiceOut(ctx, G, layer, o.pan, o.send, o.echo);
    let node = src;
    if (o.body) { const bp = ctx.createBiquadFilter(); bp.type = 'peaking'; bp.frequency.value = o.body; bp.gain.value = 5; bp.Q.value = 1.2; src.connect(bp); node = bp; }
    node.connect(g);
    const end = t + Math.min(dur, o.len);
    g.gain.setValueAtTime(o.gain * vel, t);
    g.gain.setTargetAtTime(0.0001, end, 0.06);
    src.start(t); src.stop(end + 0.5);
  }

  /* ---------- Rhodes : synthèse FM ---------- */
  function rhodes(ctx, G, layer, t, midi, dur, vel, o) {
    o = Object.assign({ pan: 0, send: 0.3, gain: 0.22, echo: 0 }, o || {});
    const f = mtof(midi), end = t + dur;
    const car = ctx.createOscillator(); car.frequency.value = f;
    const mod = ctx.createOscillator(); mod.frequency.value = f;
    const mg = ctx.createGain();
    mg.gain.setValueAtTime(f * (1.2 + 2.2 * vel), t);
    mg.gain.setTargetAtTime(f * 0.35, t, 0.35);
    mod.connect(mg); mg.connect(car.frequency);
    const tine = ctx.createOscillator(); tine.frequency.value = f * 14;
    const tg = ctx.createGain(); tg.gain.setValueAtTime(f * 1.5 * vel, t); tg.gain.setTargetAtTime(0, t, 0.02);
    tine.connect(tg); tg.connect(car.frequency);
    const amp = voiceOut(ctx, G, layer, o.pan, o.send, o.echo);
    const trem = ctx.createGain();
    const lfo = ctx.createOscillator(); lfo.frequency.value = 4.6; const lg = ctx.createGain(); lg.gain.value = 0.12;
    lfo.connect(lg); lg.connect(trem.gain); trem.gain.value = 0.88;
    car.connect(trem); trem.connect(amp);
    adsr(amp, t, 0.004, o.gain * (0.5 + 0.5 * vel), 1.6, 0.35, end, 0.35);
    [car, mod, tine, lfo].forEach((n) => { n.start(t); n.stop(end + 0.6); });
  }

  /* ---------- Nappe analogique ---------- */
  function pad(ctx, G, layer, t, midi, dur, vel, o) {
    o = Object.assign({ pan: 0, send: 0.45, gain: 0.06, cutoff: 1200, attack: 0.6, type: 'sawtooth', echo: 0 }, o || {});
    const f = mtof(midi), end = t + dur;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.cutoff; lp.Q.value = 0.7;
    const amp = voiceOut(ctx, G, layer, o.pan, o.send, o.echo);
    lp.connect(amp);
    [-7, 0, 6].forEach((c) => { const os = ctx.createOscillator(); os.type = o.type; os.frequency.value = f; os.detune.value = c; os.connect(lp); os.start(t); os.stop(end + 1.2); });
    adsr(amp, t, o.attack, o.gain * vel, 0.8, 0.8, end, 1.0);
  }

  /* ---------- Cuivres graves : trombone, saxophone baryton ---------- */
  function brass(ctx, G, layer, t, midi, dur, vel, o) {
    o = Object.assign({ pan: 0, send: 0.3, gain: 0.16, kind: 'trombone', vib: true, echo: 0 }, o || {});
    const f = mtof(midi), end = t + dur;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 1.2;
    lp.frequency.setValueAtTime(f * 1.2, t);
    lp.frequency.linearRampToValueAtTime(f * (2.5 + 4 * vel), t + 0.07);
    lp.frequency.setTargetAtTime(f * (2 + 2 * vel), t + 0.07, 0.15);
    const amp = voiceOut(ctx, G, layer, o.pan, o.send, o.echo);
    let chain = lp;
    if (o.kind === 'sax') {
      const f1 = ctx.createBiquadFilter(); f1.type = 'peaking'; f1.frequency.value = 520; f1.gain.value = 7; f1.Q.value = 1.5;
      const f2 = ctx.createBiquadFilter(); f2.type = 'peaking'; f2.frequency.value = 1500; f2.gain.value = 4; f2.Q.value = 2;
      lp.connect(f1); f1.connect(f2); chain = f2;
    }
    chain.connect(amp);
    const oscs = [];
    [0, 4].forEach((c, i) => { const os = ctx.createOscillator(); os.type = (o.kind === 'sax' && i === 1) ? 'square' : 'sawtooth'; os.frequency.value = f; os.detune.value = c; os.connect(lp); oscs.push(os); });
    if (o.vib) {
      const lfo = ctx.createOscillator(); lfo.frequency.value = 5.1; const lg = ctx.createGain();
      lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.005, t + Math.min(0.5, dur * 0.6));
      lfo.connect(lg); oscs.forEach((os) => lg.connect(os.frequency)); oscs.push(lfo);
    }
    const br = ctx.createBufferSource(); br.buffer = noiseBuffer(ctx); br.loop = true;
    const bf = ctx.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.value = 1300; bf.Q.value = 1;
    const bg = ctx.createGain(); bg.gain.value = 0.012 * vel; br.connect(bf); bf.connect(bg); bg.connect(amp); oscs.push(br);
    adsr(amp, t, 0.035, o.gain * (0.55 + 0.45 * vel), 0.4, 0.75, end, 0.18);
    oscs.forEach((n) => { n.start(t); n.stop(end + 0.4); });
  }

  /* ---------- Cordes frottées : violon, violoncelle ---------- */
  function bowed(ctx, G, layer, t, midi, dur, vel, o) {
    o = Object.assign({ pan: 0, send: 0.4, gain: 0.12, attack: 0.12, kind: 'violon', echo: 0 }, o || {});
    const f = mtof(midi), end = t + dur;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.kind === 'violon' ? 5200 : 2600;
    const res = (o.kind === 'violon' ? [[290, 4], [1050, 5], [2600, 4]] : [[180, 5], [520, 4], [1300, 3]]).map(([fr, gn]) => { const p = ctx.createBiquadFilter(); p.type = 'peaking'; p.frequency.value = fr; p.gain.value = gn; p.Q.value = 2; return p; });
    const amp = voiceOut(ctx, G, layer, o.pan, o.send, o.echo);
    let n = lp; res.forEach((r) => { n.connect(r); n = r; }); n.connect(amp);
    const os = ctx.createOscillator(); os.type = 'sawtooth'; os.frequency.value = f; os.connect(lp);
    const os2 = ctx.createOscillator(); os2.type = 'sawtooth'; os2.frequency.value = f; os2.detune.value = 5; const g2 = ctx.createGain(); g2.gain.value = 0.5; os2.connect(g2); g2.connect(lp);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 5.6; const lg = ctx.createGain();
    lg.gain.setValueAtTime(0, t); lg.gain.setValueAtTime(0, t + 0.22); lg.gain.linearRampToValueAtTime(f * 0.006, t + 0.6);
    lfo.connect(lg); lg.connect(os.frequency); lg.connect(os2.frequency);
    const nz = ctx.createBufferSource(); nz.buffer = noiseBuffer(ctx); nz.loop = true;
    const nh = ctx.createBiquadFilter(); nh.type = 'highpass'; nh.frequency.value = 2500; const ng = ctx.createGain(); ng.gain.value = 0.01;
    nz.connect(nh); nh.connect(ng); ng.connect(amp);
    adsr(amp, t, o.attack, o.gain * (0.5 + 0.5 * vel), 0.5, 0.85, end, 0.25);
    [os, os2, lfo, nz].forEach((x) => { x.start(t); x.stop(end + 0.5); });
  }

  /* ---------- Basse analogique et synthé lead ---------- */
  function synthBass(ctx, G, layer, t, midi, dur, vel, o) {
    o = Object.assign({ pan: 0, send: 0.05, gain: 0.32, glideFrom: null }, o || {});
    const f = mtof(midi), end = t + dur;
    const os = ctx.createOscillator(); os.type = 'sawtooth';
    if (o.glideFrom) { os.frequency.setValueAtTime(mtof(o.glideFrom), t); os.frequency.exponentialRampToValueAtTime(f, t + 0.05); } else os.frequency.value = f;
    const sub = ctx.createOscillator(); sub.type = 'sine'; sub.frequency.value = f;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 6;
    lp.frequency.setValueAtTime(160, t); lp.frequency.linearRampToValueAtTime(380 + 900 * vel, t + 0.02); lp.frequency.setTargetAtTime(260, t + 0.02, 0.12);
    const amp = voiceOut(ctx, G, layer, o.pan, o.send);
    os.connect(lp); lp.connect(amp); const sg = ctx.createGain(); sg.gain.value = 0.7; sub.connect(sg); sg.connect(amp);
    adsr(amp, t, 0.006, o.gain * (0.6 + 0.4 * vel), 0.3, 0.6, end, 0.08);
    [os, sub].forEach((x) => { x.start(t); x.stop(end + 0.3); });
  }
  function lead(ctx, G, layer, t, midi, dur, vel, o) {
    o = Object.assign({ pan: 0.1, send: 0.3, gain: 0.07, glideFrom: null, echo: 0.35 }, o || {});
    const f = mtof(midi), end = t + dur;
    const amp = voiceOut(ctx, G, layer, o.pan, o.send, o.echo);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2;
    lp.frequency.setValueAtTime(900, t); lp.frequency.linearRampToValueAtTime(2800 + 1500 * vel, t + 0.08); lp.frequency.setTargetAtTime(2000, t + 0.08, 0.4);
    lp.connect(amp);
    const oscs = [['square', 0], ['sawtooth', 8]].map(([ty, dt]) => { const os = ctx.createOscillator(); os.type = ty; os.detune.value = dt;
      if (o.glideFrom) { os.frequency.setValueAtTime(mtof(o.glideFrom), t); os.frequency.exponentialRampToValueAtTime(f, t + 0.06); } else os.frequency.value = f;
      os.connect(lp); return os; });
    const lfo = ctx.createOscillator(); lfo.frequency.value = 5.3; const lg = ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.004, t + 0.45);
    lfo.connect(lg); oscs.forEach((os) => lg.connect(os.frequency)); oscs.push(lfo);
    adsr(amp, t, 0.02, o.gain * (0.6 + 0.4 * vel), 0.3, 0.8, end, 0.12);
    oscs.forEach((x) => { x.start(t); x.stop(end + 0.3); });
  }

  /* ---------- Sons trouvés recréés par synthèse ---------- */

  /* Ressort à lames frappé (« enclume ») : modes de barre libre, inharmoniques */
  function anvil(ctx, G, layer, t, midi, vel, o) {
    o = Object.assign({ pan: 0, send: 0.35, gain: 0.22, ring: 1 }, o || {});
    const f = mtof(midi), amp = voiceOut(ctx, G, layer, o.pan, o.send);
    [[1, 1, 2.2], [2.756, 0.6, 1.5], [5.404, 0.42, 0.9], [8.933, 0.28, 0.55], [13.34, 0.18, 0.35]].forEach(([r, a, dec]) => {
      const os = ctx.createOscillator(); os.frequency.value = f * r * rnd(0.997, 1.003);
      const g = ctx.createGain(); g.gain.setValueAtTime(o.gain * a * vel, t); g.gain.setTargetAtTime(0.0001, t, dec * o.ring / 4);
      os.connect(g); g.connect(amp); os.start(t); os.stop(t + dec * o.ring * 1.5 + 0.1);
    });
    const nz = ctx.createBufferSource(); nz.buffer = noiseBuffer(ctx); nz.playbackRate.value = rnd(0.8, 1.2);
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500;
    const ng = ctx.createGain(); ng.gain.setValueAtTime(0.25 * vel, t); ng.gain.setTargetAtTime(0.0001, t, 0.006);
    nz.connect(hp); hp.connect(ng); ng.connect(amp); nz.start(t, Math.random()); nz.stop(t + 0.05);
    amp.gain.value = 1;
  }
  /* Tôle : bruit à travers des résonances métalliques */
  function tole(ctx, G, layer, t, vel, o) {
    o = Object.assign({ pan: 0, send: 0.25, gain: 0.25, decay: 0.12, freqs: [620, 1460, 2950, 4300] }, o || {});
    const amp = voiceOut(ctx, G, layer, o.pan, o.send);
    const nz = ctx.createBufferSource(); nz.buffer = noiseBuffer(ctx);
    const sum = ctx.createGain(); sum.gain.value = 1;
    o.freqs.forEach((fr) => { const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fr * rnd(0.97, 1.03); bp.Q.value = 9; nz.connect(bp); bp.connect(sum); });
    sum.connect(amp);
    amp.gain.setValueAtTime(o.gain * 3 * vel, t); amp.gain.setTargetAtTime(0.0001, t, o.decay / 3);
    nz.start(t, Math.random()); nz.stop(t + o.decay * 3 + 0.05);
  }
  /* Fût frappé : sourd, grave */
  function fut(ctx, G, layer, t, vel, o) {
    o = Object.assign({ pan: 0, send: 0.12, gain: 0.55, f0: 120, f1: 48 }, o || {});
    const amp = voiceOut(ctx, G, layer, o.pan, o.send);
    const os = ctx.createOscillator(); os.frequency.setValueAtTime(o.f0, t); os.frequency.exponentialRampToValueAtTime(o.f1, t + 0.12);
    os.connect(amp); amp.gain.setValueAtTime(o.gain * vel, t); amp.gain.setTargetAtTime(0.0001, t + 0.02, 0.09);
    const nz = ctx.createBufferSource(); nz.buffer = noiseBuffer(ctx); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
    const ng = ctx.createGain(); ng.gain.setValueAtTime(0.18 * vel, t); ng.gain.setTargetAtTime(0.0001, t, 0.02);
    nz.connect(lp); lp.connect(ng); ng.connect(amp);
    os.start(t); os.stop(t + 0.6); nz.start(t, Math.random()); nz.stop(t + 0.1);
  }
  /* Bornes de batterie frappées : clic métallique court */
  function borne(ctx, G, layer, t, vel, o) {
    o = Object.assign({ pan: 0, send: 0.1, gain: 0.2, pitch: 2900, echo: 0 }, o || {});
    const amp = voiceOut(ctx, G, layer, o.pan, o.send, o.echo);
    const os = ctx.createOscillator(); os.type = 'triangle'; os.frequency.value = o.pitch * rnd(0.98, 1.02);
    const g = ctx.createGain(); g.gain.setValueAtTime(o.gain * vel, t); g.gain.setTargetAtTime(0.0001, t, 0.012);
    os.connect(g); g.connect(amp); os.start(t); os.stop(t + 0.1);
    const nz = ctx.createBufferSource(); nz.buffer = noiseBuffer(ctx); const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 5000;
    const ng = ctx.createGain(); ng.gain.setValueAtTime(o.gain * 0.7 * vel, t); ng.gain.setTargetAtTime(0.0001, t, 0.008);
    nz.connect(hp); hp.connect(ng); ng.connect(amp); nz.start(t, Math.random()); nz.stop(t + 0.06);
  }
  /* Grésillement de radio */
  function radio(ctx, G, layer, t, dur, vel, o) {
    o = Object.assign({ pan: 0, send: 0.15, gain: 0.1 }, o || {});
    const amp = voiceOut(ctx, G, layer, o.pan, o.send);
    const nz = ctx.createBufferSource(); nz.buffer = noiseBuffer(ctx); nz.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 0.8;
    nz.connect(bp); bp.connect(amp);
    amp.gain.setValueAtTime(0.0001, t);
    for (let x = 0; x < dur; x += 0.025) amp.gain.setValueAtTime(Math.random() < 0.55 ? o.gain * vel * rnd(0.3, 1) : 0.0001, t + x);
    amp.gain.setValueAtTime(0.0001, t + dur);
    nz.start(t, Math.random()); nz.stop(t + dur + 0.05);
  }
  /* Ronflement secteur, accordé sur la (55 Hz) */
  function hum(ctx, G, layer, t, dur, vel, o) {
    o = Object.assign({ pan: 0, gain: 0.05, f: 55 }, o || {});
    const amp = voiceOut(ctx, G, layer, o.pan, 0.05);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; lp.connect(amp);
    const a = ctx.createOscillator(); a.type = 'sawtooth'; a.frequency.value = o.f; a.connect(lp);
    const b = ctx.createOscillator(); b.type = 'sine'; b.frequency.value = o.f * 2; const bg = ctx.createGain(); bg.gain.value = 0.6; b.connect(bg); bg.connect(amp);
    adsr(amp, t, Math.min(1.5, dur / 3), o.gain * vel, 1, 1, t + dur, 1.2);
    [a, b].forEach((x) => { x.start(t); x.stop(t + dur + 1.5); });
  }
  /* Coup sourd de transformateur (grosse caisse électrique) */
  function thump(ctx, G, layer, t, vel, o) {
    o = Object.assign({ pan: 0, gain: 0.6 }, o || {});
    const amp = voiceOut(ctx, G, layer, o.pan, 0.05);
    const os = ctx.createOscillator(); os.frequency.setValueAtTime(95, t); os.frequency.exponentialRampToValueAtTime(42, t + 0.11);
    const ws = ctx.createWaveShaper(); const cv = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; cv[i] = Math.tanh(2.2 * x); } ws.curve = cv;
    os.connect(ws); ws.connect(amp);
    amp.gain.setValueAtTime(o.gain * vel, t); amp.gain.setTargetAtTime(0.0001, t + 0.03, 0.08);
    os.start(t); os.stop(t + 0.5);
  }
  /* Chaîne de vélo : tic sec */
  function chaine(ctx, G, layer, t, vel, o) {
    o = Object.assign({ pan: 0.2, gain: 0.16, f: 5200 }, o || {});
    const amp = voiceOut(ctx, G, layer, o.pan, 0.08);
    const nz = ctx.createBufferSource(); nz.buffer = noiseBuffer(ctx);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = o.f * rnd(0.92, 1.08); bp.Q.value = 3;
    nz.connect(bp); bp.connect(amp);
    amp.gain.setValueAtTime(o.gain * vel, t); amp.gain.setTargetAtTime(0.0001, t, 0.006);
    nz.start(t, Math.random()); nz.stop(t + 0.04);
  }
  /* Roue libre : cliquetis qui ralentit */
  function roueLibre(ctx, G, layer, t, dur, vel, o) {
    let x = 0, step = 0.018;
    while (x < dur) { chaine(ctx, G, layer, t + x, vel * (1 - x / dur * 0.6), Object.assign({ f: 6200, gain: 0.1 }, o || {})); x += step; step *= 1.07; }
  }
  /* Bois : bloc frappé accordé */
  function bois(ctx, G, layer, t, midi, vel, o) {
    o = Object.assign({ pan: 0, send: 0.18, gain: 0.3 }, o || {});
    const f = mtof(midi), amp = voiceOut(ctx, G, layer, o.pan, o.send);
    const os = ctx.createOscillator(); os.frequency.value = f;
    const g = ctx.createGain(); g.gain.setValueAtTime(o.gain * vel, t); g.gain.setTargetAtTime(0.0001, t, 0.03);
    os.connect(g); g.connect(amp); os.start(t); os.stop(t + 0.25);
    const nz = ctx.createBufferSource(); nz.buffer = noiseBuffer(ctx); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2.4; bp.Q.value = 6;
    const ng = ctx.createGain(); ng.gain.setValueAtTime(o.gain * 0.9 * vel, t); ng.gain.setTargetAtTime(0.0001, t, 0.012);
    nz.connect(bp); bp.connect(ng); ng.connect(amp); nz.start(t, Math.random()); nz.stop(t + 0.08);
  }
  /* Ressort frotté à l'archet : bourdon métallique du Fond */
  function ressortFrotte(ctx, G, layer, t, midi, dur, vel, o) {
    o = Object.assign({ pan: 0, send: 0.6, gain: 0.05 }, o || {});
    const f = mtof(midi), end = t + dur, amp = voiceOut(ctx, G, layer, o.pan, o.send);
    [[1, 1], [2, 0.35], [2.756, 0.25], [4.1, 0.12], [5.404, 0.08]].forEach(([r, a]) => {
      const os = ctx.createOscillator(); os.frequency.value = f * r;
      const lfo = ctx.createOscillator(); lfo.frequency.value = rnd(0.07, 0.25); const lg = ctx.createGain(); lg.gain.value = a * 0.35;
      const g = ctx.createGain(); g.gain.value = a * 0.65; lfo.connect(lg); lg.connect(g.gain);
      os.connect(g); g.connect(amp); [os, lfo].forEach((x) => { x.start(t); x.stop(end + 3); });
    });
    const nz = ctx.createBufferSource(); nz.buffer = noiseBuffer(ctx); nz.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 4; bp.Q.value = 4;
    const ng = ctx.createGain(); ng.gain.value = 0.25; nz.connect(bp); bp.connect(ng); ng.connect(amp); nz.start(t); nz.stop(end + 3);
    adsr(amp, t, Math.min(3, dur / 3), o.gain * vel, 1, 1, end, 2.5);
  }

  /* ---------- Lecteur : programmation par mesure ---------- */

  function Player(theme) {
    this.theme = theme;
    this.ctx = null; this.G = null; this.timer = null; this.nextBar = 0; this.t0 = 0;
    this.layerOn = { fond: true, rythmique: true, basse: true, harmonie: true, melodie: true };
    this.onBar = null;
  }
  Player.prototype.barDur = function () { return 240 / this.theme.bpm; };
  Player.prototype.start = function (ctx, fromBar) {
    this.ctx = ctx;
    this.G = buildGraph(ctx, this.theme.mix);
    this.applyLayers();
    this.nextBar = fromBar || 0;
    this.t0 = ctx.currentTime + 0.12 - this.nextBar * this.barDur();
    this.stopAt = null;
    const tick = () => {
      if (!this.ctx) return;
      while (this.nextBar < this.theme.bars && this.t0 + this.nextBar * this.barDur() < this.ctx.currentTime + 0.6) {
        this.theme.bar(this.ctx, this.G, this.nextBar, this.t0 + this.nextBar * this.barDur(), lib);
        this.nextBar++;
      }
      const cur = Math.floor((this.ctx.currentTime - this.t0) / this.barDur());
      if (this.onBar) this.onBar(Math.min(cur, this.theme.bars - 1), this.ctx.currentTime - this.t0);
      if (this.ctx.currentTime > this.t0 + this.theme.bars * this.barDur() + 4) this.stop();
    };
    tick();
    this.timer = setInterval(tick, 60);
  };
  Player.prototype.applyLayers = function () {
    if (!this.G) return;
    Object.keys(this.layerOn).forEach((k) => {
      const g = this.G.layers[k].gain;
      const now = this.ctx.currentTime;
      g.cancelScheduledValues(now); g.setTargetAtTime(this.layerOn[k] ? 1 : 0.0001, now, 0.08);
    });
  };
  Player.prototype.stop = function () {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.G && this.ctx) {
      const now = this.ctx.currentTime;
      this.G.out.gain.setTargetAtTime(0.0001, now, 0.15);
      const G = this.G; setTimeout(() => { try { G.out.disconnect(); } catch (e) {} }, 900);
    }
    this.G = null; this.ctx = null;
    if (this.onStop) this.onStop();
  };

  /* Rendu hors ligne de toute la pièce, puis WAV 16 bits */
  async function renderWav(theme, layerOn, sampleRate) {
    const sr = sampleRate || 48000;
    const seconds = theme.bars * 240 / theme.bpm + 4;
    const ctx = new OfflineAudioContext(2, Math.ceil(sr * seconds), sr);
    const G = buildGraph(ctx, theme.mix);
    Object.keys(G.layers).forEach((k) => { G.layers[k].gain.value = (layerOn && layerOn[k] === false) ? 0 : 1; });
    const bd = 240 / theme.bpm;
    for (let b = 0; b < theme.bars; b++) theme.bar(ctx, G, b, 0.05 + b * bd, lib);
    const buf = await ctx.startRendering();
    return { blob: toWav(buf), buffer: buf };
  }
  function toWav(buf) {
    const ch = buf.numberOfChannels, len = buf.length, sr = buf.sampleRate;
    const data = new DataView(new ArrayBuffer(44 + len * ch * 2));
    const w = (o, s) => { for (let i = 0; i < s.length; i++) data.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); data.setUint32(4, 36 + len * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
    data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, ch, true);
    data.setUint32(24, sr, true); data.setUint32(28, sr * ch * 2, true); data.setUint16(32, ch * 2, true); data.setUint16(34, 16, true);
    w(36, 'data'); data.setUint32(40, len * ch * 2, true);
    const chans = []; for (let c = 0; c < ch; c++) chans.push(buf.getChannelData(c));
    let off = 44;
    for (let i = 0; i < len; i++) for (let c = 0; c < ch; c++) { const s = Math.max(-1, Math.min(1, chans[c][i])); data.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true); off += 2; }
    return new Blob([data], { type: 'audio/wav' });
  }

  const lib = { mtof, rnd, pluck, rhodes, pad, brass, bowed, synthBass, lead, anvil, tole, fut, borne, radio, hum, thump, chaine, roueLibre, bois, ressortFrotte };
  window.WattMusique = { Player, renderWav, lib };
})();
