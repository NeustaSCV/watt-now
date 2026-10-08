/* Watt Now? — moteur des esquisses musicales, version 2 « nappes d'ambiance ».
   Synthèse Web Audio uniquement : aucun fichier externe.
   Principe : pas d'imitation d'instruments réels (qui sonne « MIDI » sans échantillons),
   mais des nappes et des textures qui évoluent lentement, faites de la matière de chaque famille.
   Le même code sert à la lecture en direct et au rendu hors ligne (export WAV). */
(function () {
  'use strict';

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  /* ---------- Tampons générés (bruit, réverbération, matières) ---------- */

  const caches = new WeakMap();
  function cache(ctx) { if (!caches.has(ctx)) caches.set(ctx, {}); return caches.get(ctx); }

  function noiseBuffer(ctx) {
    const c = cache(ctx); if (c.noise) return c.noise;
    const len = ctx.sampleRate * 3, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return (c.noise = b);
  }

  /* Réverbération à déclin dépendant de la fréquence : graves longs, aigus courts (salle crédible, pas « boîte ») */
  function hall(ctx, rtLow, rtMid, rtHigh, predelay) {
    const sr = ctx.sampleRate, len = Math.floor(sr * (rtLow + 0.5)), pre = Math.floor(sr * predelay);
    const b = ctx.createBuffer(2, len, sr);
    const aL = 1 - Math.exp(-2 * Math.PI * 280 / sr), aH = 1 - Math.exp(-2 * Math.PI * 3200 / sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch); let l1 = 0, l2 = 0;
      for (let i = pre; i < len; i++) {
        const t = (i - pre) / sr, n = Math.random() * 2 - 1;
        l1 += aL * (n - l1); l2 += aH * (n - l2);
        const low = l1, mid = l2 - l1, high = n - l2;
        const fade = Math.min(1, t / 0.06);
        d[i] = fade * (low * Math.exp(-6.9 * t / rtLow) * 1.3 + mid * Math.exp(-6.9 * t / rtMid) + high * Math.exp(-6.9 * t / rtHigh) * 0.5);
      }
    }
    return b;
  }

  /* Matières pour les nuages de grains : chaque famille a la sienne */
  function matiere(ctx, kind) {
    const c = cache(ctx), key = 'mat_' + kind; if (c[key]) return c[key];
    const sr = ctx.sampleRate, sec = 2.5, L = Math.floor(sr * sec), b = ctx.createBuffer(1, L, sr), d = b.getChannelData(0);
    let f0 = 110;
    if (kind === 'metal') {        /* ressort à lames frappé : partiels inharmoniques */
      const parts = [[1, 1, 2.4], [2.756, 0.55, 1.6], [5.404, 0.35, 1.0], [8.933, 0.2, 0.6], [2.0, 0.25, 2.0]];
      for (let i = 0; i < L; i++) { const t = i / sr; let s = 0; parts.forEach(([r, a, dec]) => { s += a * Math.sin(2 * Math.PI * f0 * r * t) * Math.exp(-t / dec); }); d[i] = s * 0.45 * Math.min(1, t / 0.004); }
    } else if (kind === 'verre') {  /* verre électrique : série harmonique douce, battements lents */
      f0 = 220;
      for (let i = 0; i < L; i++) { const t = i / sr; let s = 0; [[1, 1], [2, 0.4], [3, 0.18], [5, 0.08], [7, 0.05]].forEach(([h, a]) => { s += a * Math.sin(2 * Math.PI * f0 * h * t + 0.3 * Math.sin(2 * Math.PI * 0.7 * t)); }); d[i] = s * 0.4 * Math.min(1, t / 0.05) * Math.exp(-t / 2.2); }
    } else {                        /* bois et cordes : corde pincée (Karplus-Strong) */
      f0 = 220; const N = Math.round(sr / f0), line = new Float32Array(N); let p = 0;
      for (let i = 0; i < N; i++) { p += (Math.random() * 2 - 1 - p) * 0.7; line[i] = p; }
      let idx = 0; for (let i = 0; i < L; i++) { const cur = line[idx]; d[i] = cur * 0.8; line[idx] = 0.997 * 0.5 * (cur + line[(idx + 1) % N]); idx = (idx + 1) % N; }
      f0 = sr / N;
    }
    return (c[key] = { buf: b, f0 });
  }

  /* Onde « anche » (harmonium) : impulsion de largeur 0,28 */
  function reedWave(ctx) {
    const c = cache(ctx); if (c.reed) return c.reed;
    const n = 40, re = new Float32Array(n), im = new Float32Array(n), duty = 0.28;
    for (let k = 1; k < n; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty) * Math.exp(-k / 22);
    return (c.reed = ctx.createPeriodicWave(re, im));
  }

  /* ---------- Graphe ---------- */

  function chorus(ctx, input, output) {
    const dry = ctx.createGain(); dry.gain.value = 0.7; input.connect(dry); dry.connect(output);
    [[0.011, 0.13, -0.7], [0.017, 0.21, 0.0], [0.023, 0.31, 0.7]].forEach(([base, rate, pan]) => {
      const dl = ctx.createDelay(0.1); dl.delayTime.value = base;
      const lfo = ctx.createOscillator(); lfo.frequency.value = rate; const lg = ctx.createGain(); lg.gain.value = 0.0025;
      lfo.connect(lg); lg.connect(dl.delayTime); lfo.start();
      const p = ctx.createStereoPanner(); p.pan.value = pan; const g = ctx.createGain(); g.gain.value = 0.38;
      input.connect(dl); dl.connect(g); g.connect(p); p.connect(output);
    });
  }

  function buildGraph(ctx, opts) {
    const o = Object.assign({ rt: [5.5, 4.2, 1.8], predelay: 0.03, verbWet: 0.5, delay: 0, delayFb: 0.4, tone: 9000, trim: {} }, opts || {});
    const master = ctx.createGain(); master.gain.value = 0.9;
    /* « Bande » : légère saturation et aigus adoucis, pour réchauffer la synthèse */
    const sat = ctx.createWaveShaper(); const sc = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = (i / 1023) * 2 - 1; sc[i] = Math.tanh(1.4 * x) / Math.tanh(1.4); }
    sat.curve = sc;
    const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = o.tone; tone.Q.value = 0.5;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.knee.value = 10; comp.ratio.value = 2.5; comp.attack.value = 0.05; comp.release.value = 0.6;
    const out = ctx.createGain(); out.gain.value = 0.95;
    const clip = ctx.createWaveShaper(); const cc = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = (i / 1023) * 2 - 1; cc[i] = 0.97 * Math.tanh(x * 1.6 / 0.97) / Math.tanh(1.6 / 0.97); }
    clip.curve = cc;
    master.connect(sat); sat.connect(tone); tone.connect(comp); comp.connect(out); out.connect(clip); clip.connect(ctx.destination);

    const verb = ctx.createConvolver(); verb.buffer = hall(ctx, o.rt[0], o.rt[1], o.rt[2], o.predelay);
    const verbIn = ctx.createGain(); verbIn.gain.value = o.verbWet;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 120;
    verbIn.connect(hp); hp.connect(verb); verb.connect(master);

    let delayIn = null;
    if (o.delay > 0) {
      delayIn = ctx.createGain(); delayIn.gain.value = 0.3;
      const dl = ctx.createDelay(3); dl.delayTime.value = o.delay;
      const fb = ctx.createGain(); fb.gain.value = o.delayFb;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
      const p = ctx.createStereoPanner(); p.pan.value = -0.4;
      delayIn.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(p); p.connect(master); p.connect(verbIn);
    }

    /* Chaque couche : interrupteur → (chorus pour l'harmonie) → niveau de mixage → maître */
    const layers = {};
    ['fond', 'rythmique', 'basse', 'harmonie', 'melodie'].forEach((name) => {
      const g = ctx.createGain(); g.gain.value = 1;
      const tr = ctx.createGain(); tr.gain.value = o.trim[name] || 1;
      if (name === 'harmonie') chorus(ctx, g, tr); else g.connect(tr);
      tr.connect(master);
      layers[name] = g;
    });
    return { master, out, verbIn, delayIn, layers };
  }

  function voiceOut(ctx, G, layer, pan, send, echo) {
    const g = ctx.createGain(); g.gain.value = 0;
    const p = ctx.createStereoPanner(); p.pan.value = pan || 0;
    g.connect(p); p.connect(G.layers[layer]);
    if (send) { const s = ctx.createGain(); s.gain.value = send; p.connect(s); s.connect(G.verbIn); }
    if (echo && G.delayIn) { const e = ctx.createGain(); e.gain.value = echo; p.connect(e); e.connect(G.delayIn); }
    return g;
  }
  /* Enveloppe lente : montée, maintien, extinction */
  function swell(g, t, a, peak, end, rel) {
    const p = g.gain;
    p.setValueAtTime(0, t);
    p.linearRampToValueAtTime(peak, t + a);
    p.setValueAtTime(peak, Math.max(t + a, end));
    p.linearRampToValueAtTime(0, Math.max(t + a, end) + rel);
  }
  /* Dérive lente de hauteur (« bande », instabilité vivante) */
  function drift(ctx, param, t, end, cents) {
    const lfo = ctx.createOscillator(); lfo.frequency.value = rnd(0.04, 0.16);
    const g = ctx.createGain(); g.gain.value = cents;
    lfo.connect(g); g.connect(param); lfo.start(t); lfo.stop(end);
  }

  /* ---------- Nappes ---------- */

  /* Nappe chaude : oscillateurs désaccordés, filtre qui respire */
  function nappe(ctx, G, layer, t, midi, dur, vel, o) {
    o = Object.assign({ type: 'sawtooth', voices: 4, spread: 14, cutoff: 900, breathe: 0.35, attack: 3, release: 4, gain: 0.03, pan: 0, send: 0.6 }, o || {});
    const f = mtof(midi), end = t + dur, stop = end + o.release + 0.2;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.cutoff; lp.Q.value = 0.4;
    const lfo = ctx.createOscillator(); lfo.frequency.value = rnd(0.05, 0.11); const lg = ctx.createGain(); lg.gain.value = o.cutoff * o.breathe;
    lfo.connect(lg); lg.connect(lp.frequency); lfo.start(t); lfo.stop(stop);
    const amp = voiceOut(ctx, G, layer, o.pan, o.send);
    lp.connect(amp);
    for (let i = 0; i < o.voices; i++) {
      const os = ctx.createOscillator(); os.type = o.type; os.frequency.value = f;
      os.detune.value = (i - (o.voices - 1) / 2) * (o.spread * 2 / Math.max(1, o.voices - 1));
      drift(ctx, os.detune, t, stop, rnd(3, 6));
      const g = ctx.createGain(); g.gain.value = 1 / o.voices; os.connect(g); g.connect(lp); os.start(t); os.stop(stop);
    }
    swell(amp, t, o.attack, o.gain * vel, end, o.release);
  }
  /* Métal frotté (Charbonniers) : partiels presque harmoniques qui scintillent lentement, sifflement d'archet */
  function metalFrotte(ctx, G, layer, t, midi, dur, vel, o) {
    o = Object.assign({ attack: 3.5, release: 5, gain: 0.025, pan: 0, send: 0.75 }, o || {});
    const f = mtof(midi), end = t + dur, stop = end + o.release + 0.2;
    const amp = voiceOut(ctx, G, layer, o.pan, o.send);
    [[1, 1], [2.003, 0.45], [3.01, 0.22], [4.17, 0.12], [5.43, 0.07]].forEach(([r, a]) => {
      const os = ctx.createOscillator(); os.frequency.value = f * r; drift(ctx, os.detune, t, stop, rnd(2, 5));
      const g = ctx.createGain(); g.gain.value = a * 0.6;
      const lfo = ctx.createOscillator(); lfo.frequency.value = rnd(0.06, 0.3); const lg = ctx.createGain(); lg.gain.value = a * 0.4;
      lfo.connect(lg); lg.connect(g.gain); os.connect(g); g.connect(amp);
      [os, lfo].forEach((x) => { x.start(t); x.stop(stop); });
    });
    const nz = ctx.createBufferSource(); nz.buffer = noiseBuffer(ctx); nz.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 3; bp.Q.value = 25;
    const ng = ctx.createGain(); ng.gain.value = 0.5; nz.connect(bp); bp.connect(ng); ng.connect(amp);
    nz.start(t, Math.random()); nz.stop(stop);
    swell(amp, t, o.attack, o.gain * vel, end, o.release);
  }
  /* Verre électrique (Voltaïques) : FM douce, indice qui ondule, tremblement de courant */
  function verreElectrique(ctx, G, layer, t, midi, dur, vel, o) {
    o = Object.assign({ attack: 2.5, release: 4.5, gain: 0.03, pan: 0, send: 0.6, ratio: 2, echo: 0 }, o || {});
    const f = mtof(midi), end = t + dur, stop = end + o.release + 0.2;
    const car = ctx.createOscillator(); car.frequency.value = f; drift(ctx, car.detune, t, stop, 4);
    const mod = ctx.createOscillator(); mod.frequency.value = f * o.ratio;
    const mg = ctx.createGain(); mg.gain.value = f * 0.6;
    const il = ctx.createOscillator(); il.frequency.value = rnd(0.05, 0.12); const ig = ctx.createGain(); ig.gain.value = f * 0.5;
    il.connect(ig); ig.connect(mg.gain); mod.connect(mg); mg.connect(car.frequency);
    const sub = ctx.createOscillator(); sub.frequency.value = f / 2; const sg = ctx.createGain(); sg.gain.value = 0.25; sub.connect(sg);
    const amp = voiceOut(ctx, G, layer, o.pan, o.send, o.echo);
    const trem = ctx.createGain(); trem.gain.value = 0.9; const tl = ctx.createOscillator(); tl.frequency.value = 6.2; const tg = ctx.createGain(); tg.gain.value = 0.06;
    tl.connect(tg); tg.connect(trem.gain);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
    car.connect(trem); sg.connect(trem); trem.connect(lp); lp.connect(amp);
    [car, mod, il, sub, tl].forEach((x) => { x.start(t); x.stop(stop); });
    swell(amp, t, o.attack, o.gain * vel, end, o.release);
  }
  /* Harmonium trouvé (Mécanistes) : deux anches légèrement désaccordées, soufflet */
  function harmonium(ctx, G, layer, t, midi, dur, vel, o) {
    o = Object.assign({ attack: 1.8, release: 3, gain: 0.03, pan: 0, send: 0.45, cutoff: 1600 }, o || {});
    const f = mtof(midi), end = t + dur, stop = end + o.release + 0.2;
    const amp = voiceOut(ctx, G, layer, o.pan, o.send);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.cutoff; lp.Q.value = 0.5;
    const body = ctx.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 700; body.gain.value = 3; body.Q.value = 1;
    const bellows = ctx.createGain(); bellows.gain.value = 0.93;
    const bl = ctx.createOscillator(); bl.frequency.value = rnd(0.15, 0.3); const bg = ctx.createGain(); bg.gain.value = 0.07; bl.connect(bg); bg.connect(bellows.gain);
    lp.connect(body); body.connect(bellows); bellows.connect(amp);
    [0, 7].forEach((c) => { const os = ctx.createOscillator(); os.setPeriodicWave(reedWave(ctx)); os.frequency.value = f; os.detune.value = c; drift(ctx, os.detune, t, stop, 2); os.connect(lp); os.start(t); os.stop(stop); });
    const nz = ctx.createBufferSource(); nz.buffer = noiseBuffer(ctx); nz.loop = true; const nb = ctx.createBiquadFilter(); nb.type = 'bandpass'; nb.frequency.value = 1800; nb.Q.value = 0.8;
    const ng = ctx.createGain(); ng.gain.value = 0.04; nz.connect(nb); nb.connect(ng); ng.connect(amp); nz.start(t, Math.random()); nz.stop(stop);
    bl.start(t); bl.stop(stop);
    swell(amp, t, o.attack, o.gain * vel, end, o.release);
  }
  /* Basse : sinus profond, entrée lente */
  function sousBasse(ctx, G, layer, t, midi, dur, vel, o) {
    o = Object.assign({ attack: 1.5, release: 3, gain: 0.16, pan: 0 }, o || {});
    const f = mtof(midi), end = t + dur, stop = end + o.release + 0.2;
    const amp = voiceOut(ctx, G, layer, o.pan, 0.08);
    const a = ctx.createOscillator(); a.frequency.value = f;
    const b = ctx.createOscillator(); b.frequency.value = f * 2; const bg = ctx.createGain(); bg.gain.value = 0.18; b.connect(bg); bg.connect(amp);
    a.connect(amp); [a, b].forEach((x) => { x.start(t); x.stop(stop); });
    swell(amp, t, o.attack, o.gain * vel, end, o.release);
  }

  /* ---------- Nuages de grains : la matière de la famille, accordée sur l'accord ---------- */
  function grains(ctx, G, layer, t, dur, kind, notes, density, o) {
    o = Object.assign({ gmin: 0.12, gmax: 0.45, gain: 0.05, send: 0.8, spread: 0.85, echo: 0 }, o || {});
    const m = matiere(ctx, kind), buf = m.buf;
    const curve = new Float32Array(32); for (let i = 0; i < 32; i++) curve[i] = Math.sin(Math.PI * i / 31) ** 2;
    let x = rnd(0, 1 / density);
    while (x < dur) {
      const tt = t + x, note = pick(notes), rate = mtof(note) / m.f0, glen = rnd(o.gmin, o.gmax);
      const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = rate;
      const off = rnd(0.02, Math.max(0.03, buf.duration - glen * rate - 0.05));
      const g = voiceOut(ctx, G, layer, rnd(-o.spread, o.spread), o.send, o.echo);
      const env = ctx.createGain(); env.gain.value = 0; src.connect(env); env.connect(g);
      g.gain.value = o.gain * rnd(0.5, 1);
      env.gain.setValueCurveAtTime(curve, tt, glen);
      src.start(tt, off); src.stop(tt + glen + 0.02);
      x += -Math.log(1 - Math.random()) / density;
    }
  }

  /* ---------- Textures et sons trouvés ---------- */

  /* Braises (Charbonniers) : crépitements et grondement sourd */
  function braises(ctx, G, layer, t, dur, vel, o) {
    o = Object.assign({ rate: 5, gain: 0.12, pan: 0 }, o || {});
    const rum = ctx.createBufferSource(); rum.buffer = noiseBuffer(ctx); rum.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 160;
    const rg = voiceOut(ctx, G, layer, o.pan, 0.2); rum.connect(lp); lp.connect(rg);
    swell(rg, t, 2, o.gain * 0.35 * vel, t + dur, 2); rum.start(t, Math.random()); rum.stop(t + dur + 2.2);
    let x = 0;
    while (x < dur) {
      const tt = t + x, pop = Math.random() < 0.12;
      const nz = ctx.createBufferSource(); nz.buffer = noiseBuffer(ctx);
      const f = ctx.createBiquadFilter(); f.type = pop ? 'bandpass' : 'highpass'; f.frequency.value = pop ? rnd(600, 1400) : rnd(1500, 4500); f.Q.value = pop ? 3 : 0.7;
      const g = voiceOut(ctx, G, layer, rnd(-0.5, 0.5), 0.25);
      nz.connect(f); f.connect(g);
      const len = pop ? rnd(0.008, 0.02) : rnd(0.002, 0.006);
      g.gain.setValueAtTime(o.gain * vel * (pop ? rnd(0.6, 1) : rnd(0.15, 0.5)), tt); g.gain.setTargetAtTime(0, tt, len);
      nz.start(tt, Math.random() * 2); nz.stop(tt + len * 6);
      x += -Math.log(1 - Math.random()) / o.rate;
    }
  }
  /* Souffle de vent (Mécanistes, Fond) : bruit dont la couleur bouge */
  function vent(ctx, G, layer, t, dur, vel, o) {
    o = Object.assign({ gain: 0.05, center: 500, pan: 0 }, o || {});
    const nz = ctx.createBufferSource(); nz.buffer = noiseBuffer(ctx); nz.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = o.center; bp.Q.value = 1.2;
    const lfo = ctx.createOscillator(); lfo.frequency.value = rnd(0.04, 0.09); const lg = ctx.createGain(); lg.gain.value = o.center * 0.5;
    lfo.connect(lg); lg.connect(bp.frequency);
    const amp = voiceOut(ctx, G, layer, o.pan, 0.3); nz.connect(bp); bp.connect(amp);
    swell(amp, t, 3, o.gain * vel, t + dur, 3);
    nz.start(t, Math.random()); lfo.start(t); nz.stop(t + dur + 3.2); lfo.stop(t + dur + 3.2);
  }
  /* Ronflement secteur sur la (55 Hz) et chuchotement de radio (Voltaïques) */
  function courant(ctx, G, layer, t, dur, vel, o) {
    o = Object.assign({ gain: 0.03, radio: 0.02 }, o || {});
    const amp = voiceOut(ctx, G, layer, 0, 0.1);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380; lp.connect(amp);
    const a = ctx.createOscillator(); a.type = 'sawtooth'; a.frequency.value = 55; a.connect(lp);
    const b = ctx.createOscillator(); b.frequency.value = 110; const bg = ctx.createGain(); bg.gain.value = 0.5; b.connect(bg); bg.connect(amp);
    swell(amp, t, 3, o.gain * vel, t + dur, 3); [a, b].forEach((x) => { x.start(t); x.stop(t + dur + 3.2); });
    const nz = ctx.createBufferSource(); nz.buffer = noiseBuffer(ctx); nz.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 2;
    const rg = voiceOut(ctx, G, layer, 0.4, 0.4); nz.connect(bp); bp.connect(rg);
    const am = ctx.createOscillator(); am.frequency.value = 0.11; const ag = ctx.createGain(); ag.gain.value = o.radio * vel; am.connect(ag); ag.connect(rg.gain);
    rg.gain.value = 0; nz.start(t, Math.random()); am.start(t); nz.stop(t + dur + 1); am.stop(t + dur + 1);
  }
  /* Coup lointain sur le ressort (enclume au loin) */
  function enclumeLointaine(ctx, G, layer, t, midi, vel, o) {
    o = Object.assign({ gain: 0.08, pan: 0, send: 0.9 }, o || {});
    const f = mtof(midi), amp = voiceOut(ctx, G, layer, o.pan, o.send);
    [[1, 1, 2.4], [2.756, 0.5, 1.5], [5.404, 0.3, 0.8], [8.933, 0.15, 0.4]].forEach(([r, a, dec]) => {
      const os = ctx.createOscillator(); os.frequency.value = f * r;
      const g = ctx.createGain(); g.gain.setValueAtTime(a, t); g.gain.setTargetAtTime(0, t, dec / 3);
      os.connect(g); g.connect(amp); os.start(t); os.stop(t + dec * 2 + 0.1);
    });
    amp.gain.value = o.gain * vel;
  }
  /* Clic de borne de batterie, très court */
  function borne(ctx, G, layer, t, vel, o) {
    o = Object.assign({ gain: 0.05, pitch: 2600, pan: 0, echo: 0.5 }, o || {});
    const amp = voiceOut(ctx, G, layer, o.pan, 0.3, o.echo);
    const os = ctx.createOscillator(); os.type = 'triangle'; os.frequency.value = o.pitch;
    os.connect(amp); amp.gain.setValueAtTime(o.gain * vel, t); amp.gain.setTargetAtTime(0, t, 0.015);
    os.start(t); os.stop(t + 0.12);
  }
  /* Bois frappé, doux */
  function bois(ctx, G, layer, t, midi, vel, o) {
    o = Object.assign({ gain: 0.08, pan: 0, send: 0.5 }, o || {});
    const f = mtof(midi), amp = voiceOut(ctx, G, layer, o.pan, o.send);
    const os = ctx.createOscillator(); os.frequency.value = f; os.connect(amp);
    amp.gain.setValueAtTime(o.gain * vel, t); amp.gain.setTargetAtTime(0, t, 0.04);
    os.start(t); os.stop(t + 0.3);
  }
  /* Roue libre au loin */
  function roueLibre(ctx, G, layer, t, dur, vel, o) {
    o = Object.assign({ gain: 0.03, pan: 0.5 }, o || {});
    let x = 0, step = 0.02;
    while (x < dur) {
      const nz = ctx.createBufferSource(); nz.buffer = noiseBuffer(ctx);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 5500; bp.Q.value = 3;
      const g = voiceOut(ctx, G, layer, o.pan, 0.6); nz.connect(bp); bp.connect(g);
      g.gain.setValueAtTime(o.gain * vel * (1 - x / dur * 0.7), t + x); g.gain.setTargetAtTime(0, t + x, 0.004);
      nz.start(t + x, Math.random() * 2); nz.stop(t + x + 0.03);
      x += step; step *= 1.06;
    }
  }
  /* Ressort frotté : bourdon du Fond (commun au terrain) */
  function ressortFrotte(ctx, G, layer, t, midi, dur, vel, o) {
    o = Object.assign({ gain: 0.04, pan: 0, send: 0.7 }, o || {});
    metalFrotte(ctx, G, layer, t, midi, dur, vel, { attack: Math.min(4, dur / 3), release: 4, gain: o.gain, pan: o.pan, send: o.send });
  }

  /* ---------- Fragments mélodiques lointains ---------- */
  function fragment(ctx, G, layer, t, midi, dur, vel, o) {
    o = Object.assign({ kind: 'cloche', gain: 0.05, pan: 0, send: 0.9, echo: 0.35 }, o || {});
    const f = mtof(midi), amp = voiceOut(ctx, G, layer, o.pan, o.send, o.echo);
    if (o.kind === 'cloche') {           /* cloche électrique douce */
      const car = ctx.createOscillator(); car.frequency.value = f;
      const mod = ctx.createOscillator(); mod.frequency.value = f * 3.5;
      const mg = ctx.createGain(); mg.gain.setValueAtTime(f * 1.2, t); mg.gain.setTargetAtTime(f * 0.1, t, 0.5);
      mod.connect(mg); mg.connect(car.frequency); car.connect(amp);
      amp.gain.setValueAtTime(o.gain * vel, t); amp.gain.setTargetAtTime(0, t, Math.max(0.6, dur) / 2.5);
      [car, mod].forEach((x) => { x.start(t); x.stop(t + dur * 2 + 3); });
    } else if (o.kind === 'harmonique') { /* harmonique de corde pincée */
      const N = Math.round(ctx.sampleRate / f), L = Math.floor(ctx.sampleRate * 3.5), b = ctx.createBuffer(1, L, ctx.sampleRate), d = b.getChannelData(0), line = new Float32Array(N);
      for (let i = 0; i < N; i++) line[i] = Math.sin(2 * Math.PI * i / N) * 0.8 + (Math.random() - 0.5) * 0.15;
      let idx = 0; for (let i = 0; i < L; i++) { const cur = line[idx]; d[i] = cur; line[idx] = 0.9993 * 0.5 * (cur + line[(idx + 1) % N]); idx = (idx + 1) % N; }
      const src = ctx.createBufferSource(); src.buffer = b; src.playbackRate.value = N / (ctx.sampleRate / f); src.connect(amp);
      amp.gain.setValueAtTime(o.gain * vel, t); src.start(t); src.stop(t + 3.6);
    } else {                              /* souffle métallique chanté (Charbonniers) */
      const os = ctx.createOscillator(); os.type = 'triangle'; os.frequency.value = f;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 4.8; const lg = ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.004, t + dur * 0.6);
      lfo.connect(lg); lg.connect(os.frequency);
      const p2 = ctx.createOscillator(); p2.frequency.value = f * 2.003; const pg = ctx.createGain(); pg.gain.value = 0.2; p2.connect(pg);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
      os.connect(lp); pg.connect(lp); lp.connect(amp);
      swell(amp, t, Math.min(1.2, dur * 0.5), o.gain * vel, t + dur, 1.5);
      [os, lfo, p2].forEach((x) => { x.start(t); x.stop(t + dur + 1.8); });
    }
  }

  /* ---------- Lecteur par mesure ---------- */

  function Player(theme) {
    this.theme = theme; this.ctx = null; this.G = null; this.timer = null; this.nextBar = 0; this.t0 = 0;
    this.layerOn = { fond: true, rythmique: true, basse: true, harmonie: true, melodie: true };
    this.onBar = null; this.onStop = null;
  }
  Player.prototype.barDur = function () { return 240 / this.theme.bpm; };
  Player.prototype.start = function (ctx, fromBar) {
    this.ctx = ctx; this.G = buildGraph(ctx, this.theme.mix); this.applyLayers();
    this.nextBar = fromBar || 0; this.t0 = ctx.currentTime + 1.0 - this.nextBar * this.barDur(); /* 1 s de marge : les nappes commencent avant le temps */
    const tick = () => {
      if (!this.ctx) return;
      while (this.nextBar < this.theme.bars && this.t0 + this.nextBar * this.barDur() < this.ctx.currentTime + 1.6) {
        this.theme.bar(this.ctx, this.G, this.nextBar, this.t0 + this.nextBar * this.barDur(), lib);
        this.nextBar++;
      }
      const cur = Math.floor((this.ctx.currentTime - this.t0) / this.barDur());
      if (this.onBar) this.onBar(Math.max(0, Math.min(cur, this.theme.bars - 1)), this.ctx.currentTime - this.t0);
      if (this.ctx.currentTime > this.t0 + this.theme.bars * this.barDur() + 7) this.stop();
    };
    tick(); this.timer = setInterval(tick, 80);
  };
  Player.prototype.applyLayers = function () {
    if (!this.G) return;
    Object.keys(this.layerOn).forEach((k) => { const g = this.G.layers[k].gain, now = this.ctx.currentTime; g.cancelScheduledValues(now); g.setTargetAtTime(this.layerOn[k] ? 1 : 0, now, 0.15); });
  };
  Player.prototype.stop = function () {
    if (this.timer) clearInterval(this.timer); this.timer = null;
    if (this.G && this.ctx) { const now = this.ctx.currentTime, G = this.G; G.out.gain.setTargetAtTime(0, now, 0.4); setTimeout(() => { try { G.out.disconnect(); } catch (e) {} }, 2500); }
    this.G = null; this.ctx = null; if (this.onStop) this.onStop();
  };

  async function renderWav(theme, layerOn, sampleRate) {
    const sr = sampleRate || 48000, seconds = theme.bars * 240 / theme.bpm + 8;
    const ctx = new OfflineAudioContext(2, Math.ceil(sr * seconds), sr);
    const G = buildGraph(ctx, theme.mix);
    Object.keys(G.layers).forEach((k) => { G.layers[k].gain.value = (layerOn && layerOn[k] === false) ? 0 : 1; });
    const bd = 240 / theme.bpm;
    for (let b = 0; b < theme.bars; b++) theme.bar(ctx, G, b, 1.0 + b * bd, lib);
    const buf = await ctx.startRendering();
    return { blob: toWav(buf), buffer: buf };
  }
  function toWav(buf) {
    const ch = buf.numberOfChannels, len = buf.length, sr = buf.sampleRate, data = new DataView(new ArrayBuffer(44 + len * ch * 2));
    const w = (o, s) => { for (let i = 0; i < s.length; i++) data.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); data.setUint32(4, 36 + len * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
    data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, ch, true); data.setUint32(24, sr, true);
    data.setUint32(28, sr * ch * 2, true); data.setUint16(32, ch * 2, true); data.setUint16(34, 16, true); w(36, 'data'); data.setUint32(40, len * ch * 2, true);
    const chans = []; for (let c = 0; c < ch; c++) chans.push(buf.getChannelData(c));
    let off = 44; for (let i = 0; i < len; i++) for (let c = 0; c < ch; c++) { const s = Math.max(-1, Math.min(1, chans[c][i])); data.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true); off += 2; }
    return new Blob([data], { type: 'audio/wav' });
  }

  const lib = { mtof, rnd, pick, nappe, metalFrotte, verreElectrique, harmonium, sousBasse, grains, braises, vent, courant, enclumeLointaine, borne, bois, roueLibre, ressortFrotte, fragment };
  window.WattMusique = { Player, renderWav, lib };
})();
