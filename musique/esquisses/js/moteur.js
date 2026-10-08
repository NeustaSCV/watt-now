/* Watt Now? — moteur des esquisses musicales, version 3 « souffle accordé et effets discrets » (v2 et v1 dans archives/).
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

    /* Chaque couche : interrupteur → (chorus pour l'harmonie) → niveau de mixage → maître.
       Les envois vers la réverbération et l'écho passent aussi par l'interrupteur de la couche :
       couper une couche coupe aussi sa réverbération. */
    const layers = {}, layerVerb = {}, layerEcho = {}, names = o.couches || ['fond', 'rythmique', 'basse', 'harmonie', 'effets'];
    names.forEach((name) => {
      const trim = o.trim[name] || 1;
      const g = ctx.createGain(); g.gain.value = 1;
      const tr = ctx.createGain(); tr.gain.value = trim;
      if (name === 'harmonie') chorus(ctx, g, tr); else g.connect(tr);
      tr.connect(master);
      const gv = ctx.createGain(); gv.gain.value = 1; const tv = ctx.createGain(); tv.gain.value = trim; gv.connect(tv); tv.connect(verbIn);
      layers[name] = g; layerVerb[name] = gv;
      if (delayIn) { const ge = ctx.createGain(); ge.gain.value = 1; const te = ctx.createGain(); te.gain.value = trim; ge.connect(te); te.connect(delayIn); layerEcho[name] = ge; }
    });
    function setLayer(name, on, now) {
      [layers[name], layerVerb[name], layerEcho[name]].forEach((n) => {
        if (!n) return;
        if (now == null) { n.gain.value = on ? 1 : 0; return; }
        n.gain.cancelScheduledValues(now); n.gain.setTargetAtTime(on ? 1 : 0, now, 0.15);
      });
    }
    return { master, out, verbIn, delayIn, layers, layerVerb, layerEcho, setLayer, seule: o.seule || null };
  }

  function voiceOut(ctx, G, layer, pan, send, echo) {
    const g = ctx.createGain(); g.gain.value = 0;
    /* Rendu d'un seul stem : les voix des autres couches ne sont reliées à rien, donc pas calculées */
    if (G.seule && G.seule !== layer) return g;
    const p = ctx.createStereoPanner(); p.pan.value = pan || 0;
    g.connect(p); p.connect(G.layers[layer]);
    if (send) { const s = ctx.createGain(); s.gain.value = send; p.connect(s); s.connect(G.layerVerb ? G.layerVerb[layer] : G.verbIn); }
    if (echo && G.delayIn) { const e = ctx.createGain(); e.gain.value = echo; p.connect(e); e.connect(G.layerEcho[layer]); }
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
  /* Courbe lente en rampes linéaires : beaucoup moins coûteux que setValueCurveAtTime dans Chrome */
  function courbe(param, t, len, values) {
    const n = values.length; param.setValueAtTime(values[0], t);
    for (let i = 1; i < n; i++) param.linearRampToValueAtTime(values[i], t + len * i / (n - 1));
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


  /* ======================================================================
     Version 3 : nappe de souffle accordé et petits effets discrets
     ====================================================================== */

  /* Bruit long (13 s) pour les filtres très étroits : un bruit court bouclé s'entendrait comme un motif */
  function noiseLong(ctx) {
    const c = cache(ctx); if (c.noiseLong) return c.noiseLong;
    const len = ctx.sampleRate * 13, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return (c.noiseLong = b);
  }

  /* Souffle accordé : bruit filtré très étroit sur la note et quelques partiels.
     Un souffle qui chante, sans attaque ni timbre d'instrument. La couleur porte la matière de la famille. */
  const COULEURS = {
    fond:  { parts: [[1, 1], [2, 0.3]], q: 40, sine: 0.2 },
    metal: { parts: [[1, 1], [2.003, 0.4], [3.01, 0.22], [4.17, 0.12]], q: 55, sine: 0.1 },
    verre: { parts: [[1, 1], [2, 0.3], [4, 0.14]], q: 80, sine: 0.3 },
    bois:  { parts: [[1, 1], [2, 0.45], [3, 0.25], [5, 0.08]], q: 28, sine: 0.06 },
    /* Cuve vide (halte) : partiels inharmoniques d'un grand cylindre de métal, très résonants */
    cuve:  { parts: [[1, 1], [1.59, 0.5], [2.14, 0.35], [2.65, 0.22], [3.5, 0.1]], q: 70, sine: 0.1 },
    /* Flûte grave très légère : fondamentale presque pure, un peu de souffle large (air) */
    flute: { parts: [[1, 1], [2, 0.15], [3, 0.05]], q: 90, sine: 0.5, air: 0.12 }
  };
  function souffleAccorde(ctx, G, layer, t, midi, dur, vel, o) {
    o = Object.assign({ couleur: 'bois', gain: 0.05, attack: 4, release: 5, pan: 0, send: 0.7, flutter: 0.35 }, o || {});
    const C = COULEURS[o.couleur], f = mtof(midi), end = t + dur, stop = end + o.release + 0.3, nyq = ctx.sampleRate / 2;
    const amp = voiceOut(ctx, G, layer, o.pan, o.send);
    /* Respiration lente : courbe d'automation précalculée (moins coûteux qu'un LFO branché sur le gain) */
    const fl = ctx.createGain(); fl.connect(amp);
    const fr0 = rnd(0.05, 0.14), ph0 = rnd(0, 6.28), np = Math.max(8, Math.ceil((stop - t) * 2)), cv = new Float32Array(np);
    for (let i = 0; i < np; i++) cv[i] = 1 - o.flutter / 2 + (o.flutter / 2) * Math.sin(ph0 + 2 * Math.PI * fr0 * (stop - t) * i / (np - 1));
    courbe(fl.gain, t, stop - t, cv);
    const nz = ctx.createBufferSource(); nz.buffer = noiseLong(ctx); nz.loop = true;
    C.parts.forEach(([r, a]) => {
      const fr = f * r; if (fr > nyq * 0.9) return;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fr; bp.Q.value = C.q;
      const g = ctx.createGain(); g.gain.value = a * 0.35 / (0.577 * Math.sqrt((fr / C.q) / nyq));
      nz.connect(bp); bp.connect(g); g.connect(fl);
    });
    if (C.air) {
      const fa = Math.min(f * 3, nyq * 0.8), bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fa; bp.Q.value = 1.2;
      const g = ctx.createGain(); g.gain.value = C.air * 0.35 / (0.577 * Math.sqrt((fa / 1.2) / nyq)); nz.connect(bp); bp.connect(g); g.connect(fl);
    }
    if (C.sine) { const os = ctx.createOscillator(); os.frequency.value = f; os.detune.value = rnd(-4, 4); const sg = ctx.createGain(); sg.gain.value = C.sine * 0.5; os.connect(sg); sg.connect(fl); os.start(t); os.stop(stop); }
    nz.start(t, rnd(0, 12)); nz.stop(stop);
    swell(amp, t, o.attack, o.gain * vel, end, o.release);
  }


  /* Onde douce (Voltaïques) : deux triangles à peine désaccordées et une sous-octave sinus, filtre fermé.
     Pas de dent de scie. Battement lent entre les triangles et pulsation très douce en automation. */
  function ondeDouce(ctx, G, layer, t, midi, dur, vel, o) {
    o = Object.assign({ gain: 0.045, attack: 4, release: 5, pan: 0, send: 0.6, echo: 0, cutoff: 1400, pulse: 0, depth: 0.18 }, o || {});
    const f = mtof(midi), end = t + dur, stop = end + o.release + 0.3, len = stop - t;
    const amp = voiceOut(ctx, G, layer, o.pan, o.send, o.echo);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.cutoff; lp.Q.value = 0.6;
    let node = lp;
    if (o.pulse) {
      const pl = ctx.createGain(), np = Math.ceil(len * o.pulse * 4) + 1, cv = new Float32Array(np);
      const ph = (o.grille == null ? 0 : t - o.grille); /* calée sur la grille, même si la voix entre en décalé */
      for (let i = 0; i < np; i++) cv[i] = 1 - o.depth * (0.5 + 0.5 * Math.cos(2 * Math.PI * o.pulse * (ph + len * i / (np - 1))));
      courbe(pl.gain, t, len, cv); lp.connect(pl); node = pl;
    }
    node.connect(amp);
    [[-5, 0.35, 'triangle', 1], [5, 0.35, 'triangle', 1], [0, 0.2, 'sine', 0.5]].forEach(([c, a, type, r]) => {
      const os = ctx.createOscillator(); os.type = type; os.frequency.value = f * r;
      os.detune.value = c + rnd(-2, 2); /* désaccord fixe : le battement lent entre les deux triangles suffit à faire vivre le son */
      const g = ctx.createGain(); g.gain.value = a; os.connect(g); g.connect(lp); os.start(t); os.stop(stop);
    });
    swell(amp, t, o.attack, o.gain * vel, end, o.release);
  }

  /* Feuillage : bruit aigu soufflé par rafales irrégulières */
  function feuillage(ctx, G, layer, t, dur, vel, o) {
    o = Object.assign({ gain: 0.02, pan: 0 }, o || {});
    const nz = ctx.createBufferSource(); nz.buffer = noiseLong(ctx); nz.loop = true;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500;
    const gust = ctx.createGain(); gust.gain.value = 0.4;
    [[rnd(0.11, 0.16), 0.3], [rnd(0.31, 0.43), 0.2], [rnd(1.7, 2.3), 0.08]].forEach(([fr, dp]) => { const l = ctx.createOscillator(); l.frequency.value = fr; const g = ctx.createGain(); g.gain.value = dp; l.connect(g); g.connect(gust.gain); l.start(t); l.stop(t + dur + 3.2); });
    const amp = voiceOut(ctx, G, layer, o.pan, 0.4); nz.connect(hp); hp.connect(gust); gust.connect(amp);
    swell(amp, t, 3, o.gain * vel, t + dur, 3); nz.start(t, rnd(0, 12)); nz.stop(t + dur + 3.2);
  }

  /* ---------- Effets : tampons calculés en JavaScript (synthèse modale), joués une fois ---------- */

  function sfxBuffer(ctx, sec, fill) {
    const sr = ctx.sampleRate, L = Math.ceil(sr * sec), b = ctx.createBuffer(1, L, sr), d = b.getChannelData(0);
    fill(d, sr, L);
    let pk = 0; for (let i = 0; i < L; i++) { if (!isFinite(d[i])) d[i] = 0; pk = Math.max(pk, Math.abs(d[i])); }
    if (pk > 0) for (let i = 0; i < L; i++) d[i] /= pk;
    return b;
  }
  function jouerSfx(ctx, G, layer, t, buf, o) {
    o = Object.assign({ gain: 0.05, pan: 0, send: 0.6, echo: 0, lp: 0, hp: 0 }, o || {});
    const src = ctx.createBufferSource(); src.buffer = buf; let node = src;
    if (o.hp) { const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = o.hp; node.connect(f); node = f; }
    if (o.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; node.connect(f); node = f; }
    const amp = voiceOut(ctx, G, layer, o.pan, o.send, o.echo); amp.gain.value = o.gain; node.connect(amp);
    src.start(Math.max(t, 0));
  }
  /* Résonateurs modaux : chaque mode [fréquence, amplitude, déclin en s] sonne quand l'excitation x le frappe */
  function resonner(x, d, sr, modes) {
    modes.forEach(([f, a, dec]) => {
      if (f >= sr * 0.45) return;
      const r = Math.exp(-1 / (dec * sr)), w = 2 * Math.PI * f / sr, c1 = 2 * r * Math.cos(w), c2 = -r * r, g = a * Math.sin(w);
      let y1 = 0, y2 = 0;
      for (let i = 0; i < x.length; i++) { const y = g * x[i] + c1 * y1 + c2 * y2; y2 = y1; y1 = y; d[i] += y; }
    });
  }
  /* Partiel amorti ajouté directement au tampon */
  function ping(d, sr, t0, f, a, dec) {
    if (f >= sr * 0.45) return;
    const i0 = Math.floor(t0 * sr), n = Math.min(d.length - i0, Math.floor(dec * 6 * sr)), w = 2 * Math.PI * f / sr, ph = Math.random() * 6.28, at = 0.0006 * sr;
    for (let i = 0; i < n; i++) d[i0 + i] += a * Math.sin(w * i + ph) * Math.exp(-i / (dec * sr)) * Math.min(1, i / at);
  }
  /* Frottement (adhérence-glissement) : train d'impulsions irrégulier, le grincement */
  function frottement(sr, L, dur, r0, r1) {
    const x = new Float32Array(L); let tt = rnd(0, 0.02);
    while (tt < dur) {
      const ph = tt / dur, env = Math.pow(Math.sin(Math.PI * ph), 0.6), rate = r0 + (r1 - r0) * Math.sin(Math.PI * ph), i = Math.floor(tt * sr);
      if (i < L) x[i] += env * rnd(0.5, 1);
      tt += rnd(0.8, 1.2) / rate;
    }
    return x;
  }

  /* --- Charbonniers : métal --- */
  function grincementMetal(ctx, G, layer, t, o) {
    o = Object.assign({ gain: 0.05, pan: rnd(-0.7, 0.7) }, o || {});
    const dur = rnd(1.2, 2.4), f0 = rnd(380, 620);
    const buf = sfxBuffer(ctx, dur + 0.8, (d, sr, L) => resonner(frottement(sr, L, dur, rnd(14, 28), rnd(35, 70)), d, sr, [[f0, 1, 0.22], [f0 * 2.76, 0.6, 0.15], [f0 * 5.4, 0.35, 0.09], [f0 * 8.93, 0.2, 0.05]]));
    jouerSfx(ctx, G, layer, t, buf, { gain: o.gain, pan: o.pan, send: 0.9, lp: 4000, hp: 200 });
  }
  function chaine(ctx, G, layer, t, o) {
    o = Object.assign({ gain: 0.035, pan: rnd(-0.6, 0.6) }, o || {});
    const dur = rnd(0.5, 1.1), n = 7 + Math.floor(Math.random() * 8);
    const buf = sfxBuffer(ctx, dur + 0.6, (d, sr) => {
      for (let k = 0; k < n; k++) { const tt = dur * Math.pow(Math.random(), 1.4), f = rnd(1800, 3200), a = rnd(0.3, 1); ping(d, sr, tt, f, a, rnd(0.04, 0.09)); ping(d, sr, tt, f * 2.41, a * 0.5, rnd(0.02, 0.05)); ping(d, sr, tt, f * 3.93, a * 0.3, 0.02); }
    });
    jouerSfx(ctx, G, layer, t, buf, { gain: o.gain, pan: o.pan, send: 0.8, lp: 6000 });
  }
  function chocLointain(ctx, G, layer, t, o) {
    o = Object.assign({ gain: 0.07, pan: rnd(-0.5, 0.5), lp: 900 }, o || {});
    const f0 = rnd(62, 95);
    const buf = sfxBuffer(ctx, 4, (d, sr) => {
      [[1, 1, 1.6], [2.76, 0.6, 1.0], [5.4, 0.4, 0.5], [8.93, 0.25, 0.25], [13.34, 0.15, 0.12]].forEach(([r, a, dec]) => ping(d, sr, 0, f0 * r * rnd(0.99, 1.01), a, dec));
      let lp = 0; const n = Math.floor(0.04 * sr); for (let i = 0; i < n; i++) { lp += 0.05 * ((Math.random() * 2 - 1) - lp); d[i] += lp * 6 * (1 - i / n); }
    });
    jouerSfx(ctx, G, layer, t, buf, { gain: o.gain, pan: o.pan, send: 1.3, lp: o.lp });
  }
  function ticMetal(ctx, G, layer, t, o) {
    o = Object.assign({ gain: 0.02, pan: rnd(-0.8, 0.8) }, o || {});
    const n = 1 + Math.floor(Math.random() * 3);
    const buf = sfxBuffer(ctx, 2.2, (d, sr) => { let tt = 0; for (let k = 0; k < n; k++) { const f = rnd(3000, 4600); ping(d, sr, tt, f, 1, rnd(0.04, 0.08)); ping(d, sr, tt, f * 1.53, 0.4, 0.03); tt += rnd(0.2, 0.7); } });
    jouerSfx(ctx, G, layer, t, buf, { gain: o.gain, pan: o.pan, send: 0.7 });
  }

  /* --- Voltaïques : électricité et verre --- */
  function arcElectrique(ctx, G, layer, t, o) {
    o = Object.assign({ gain: 0.03, pan: rnd(-0.6, 0.6) }, o || {});
    const dur = rnd(0.5, 1.3);
    const buf = sfxBuffer(ctx, dur + 0.3, (d, sr, L) => {
      const act = new Float32Array(L); let tt = 0, burst = 0;
      while (tt < dur) {
        if (burst <= 0) { tt += rnd(0.03, 0.18); burst = 3 + Math.floor(Math.random() * 12); continue; }
        const i0 = Math.floor(tt * sr), len = Math.max(2, Math.floor(rnd(0.0003, 0.003) * sr)), a = rnd(0.3, 1);
        for (let i = 0; i < len && i0 + i < L; i++) { d[i0 + i] += a * (Math.random() * 2 - 1) * (1 - i / len); act[i0 + i] = 1; }
        tt += rnd(0.002, 0.02); burst--;
      }
      let e = 0; const k = 1 - Math.exp(-1 / (0.03 * sr)), w = 2 * Math.PI * 100 / sr;
      for (let i = 0; i < L; i++) { e += k * (act[i] - e); if (e < 1e-3) continue; let s = 0; for (let h = 1; h <= 12; h++) s += Math.sin(w * h * i) / h; d[i] += 0.5 * Math.min(1, e * 4) * s; }
    });
    jouerSfx(ctx, G, layer, t, buf, { gain: o.gain, pan: o.pan, send: 0.5, echo: 0.25, hp: 180, lp: 8000 });
  }
  function verreTinte(ctx, G, layer, t, o) {
    o = Object.assign({ gain: 0.028, pan: rnd(-0.7, 0.7) }, o || {});
    const buf = sfxBuffer(ctx, 2.5, (d, sr) => {
      const clink = (t0, f0, a) => { [[1, 1, 0.9], [2.32, 0.5, 0.5], [4.25, 0.3, 0.3], [6.63, 0.15, 0.15]].forEach(([r, aa, dec]) => ping(d, sr, t0, f0 * r, a * aa, dec * rnd(0.8, 1.2))); };
      const f0 = rnd(1700, 2900); clink(0, f0, 1);
      if (Math.random() < 0.45) clink(rnd(0.06, 0.16), f0 * rnd(0.96, 1.04), 0.55);
    });
    jouerSfx(ctx, G, layer, t, buf, { gain: o.gain, pan: o.pan, send: 0.8, echo: 0.3 });
  }
  function relais(ctx, G, layer, t, o) {
    o = Object.assign({ gain: 0.04, pan: rnd(-0.6, 0.6) }, o || {});
    const buf = sfxBuffer(ctx, 0.4, (d, sr, L) => {
      const x = new Float32Array(L);
      [0, rnd(0.03, 0.08)].forEach((tt, k) => { const i0 = Math.floor(tt * sr); for (let i = 0; i < 0.0008 * sr; i++) x[i0 + i] += (Math.random() * 2 - 1) * (k ? 0.6 : 1); });
      resonner(x, d, sr, [[rnd(1500, 2200), 1, 0.012], [rnd(3500, 4300), 0.6, 0.007], [rnd(170, 230), 0.8, 0.02]]);
    });
    jouerSfx(ctx, G, layer, t, buf, { gain: o.gain, pan: o.pan, send: 0.5, echo: 0.2 });
  }
  function neon(ctx, G, layer, t, o) {
    o = Object.assign({ gain: 0.018, pan: rnd(-0.5, 0.5) }, o || {});
    const dur = rnd(2.5, 4);
    const buf = sfxBuffer(ctx, dur, (d, sr, L) => {
      const gate = new Float32Array(L), fl = rnd(0.5, 1.1); let tt = 0, on = false;
      while (tt < fl) { const len = rnd(0.02, 0.12); if (on) for (let i = Math.floor(tt * sr); i < Math.min(L, (tt + len) * sr); i++) gate[i] = 1; on = !on; tt += len; }
      for (let i = Math.floor(fl * sr); i < L; i++) gate[i] = Math.min(1, Math.max(0, 1.6 * (1 - (i / sr - fl) / (dur - fl))));
      let g = 0; const k = 1 - Math.exp(-1 / (0.004 * sr)), w = 2 * Math.PI * 100 / sr;
      for (let i = 0; i < L; i++) { g += k * (gate[i] - g); if (g < 1e-4) { d[i] = 0; continue; } let s = 0; for (let h = 1; h <= 16; h++) s += Math.sin(w * h * i + h) / Math.pow(h, 1.1); d[i] = g * (s + 0.15 * (Math.random() * 2 - 1)); }
    });
    jouerSfx(ctx, G, layer, t, buf, { gain: o.gain, pan: o.pan, send: 0.4, hp: 90, lp: 5000 });
  }

  /* --- Mécanistes : nature, ferme, bois --- */
  function oiseau(ctx, G, layer, t, o) {
    o = Object.assign({ gain: 0.02, pan: rnd(-0.85, 0.85), espece: null }, o || {});
    const sp = o.espece || pick(['siffle', 'trille', 'appel']);
    const buf = sfxBuffer(ctx, 2.2, (d, sr) => {
      const chirp = (t0, len, fA, fB, fm, fmd) => {
        const i0 = Math.floor(t0 * sr), n = Math.floor(len * sr); let ph = 0;
        for (let i = 0; i < n && i0 + i < d.length; i++) { const x = i / n, f = fA + (fB - fA) * (x * x * (3 - 2 * x)) + (fm ? fmd * Math.sin(2 * Math.PI * fm * i / sr) : 0); ph += 2 * Math.PI * f / sr; d[i0 + i] += Math.pow(Math.sin(Math.PI * x), 1.5) * (Math.sin(ph) + 0.12 * Math.sin(2 * ph)); }
      };
      if (sp === 'siffle') { let tt = 0; const n = 2 + Math.floor(Math.random() * 4), f1 = rnd(2600, 3600); for (let k = 0; k < n; k++) { const len = rnd(0.07, 0.14); chirp(tt, len, f1 * rnd(0.97, 1.03), f1 * rnd(0.6, 0.8), 0, 0); tt += len + rnd(0.05, 0.12); } }
      else if (sp === 'trille') chirp(0, rnd(0.6, 1.1), rnd(3800, 4400), rnd(3600, 4200), rnd(24, 34), rnd(250, 450));
      else { const f = rnd(2400, 3000); chirp(0, 0.18, f, f * 1.3, 0, 0); chirp(0.3, 0.26, f * 1.2, f * 0.85, 0, 0); }
    });
    jouerSfx(ctx, G, layer, t, buf, { gain: o.gain, pan: o.pan, send: 0.7, hp: 1500, lp: 7500 });
  }
  function craquementBois(ctx, G, layer, t, o) {
    o = Object.assign({ gain: 0.05, pan: rnd(-0.7, 0.7) }, o || {});
    const dur = rnd(0.8, 1.8);
    const buf = sfxBuffer(ctx, dur + 0.4, (d, sr, L) => resonner(frottement(sr, L, dur, rnd(6, 12), rnd(14, 26)), d, sr, [[rnd(160, 220), 1, 0.05], [rnd(380, 460), 0.7, 0.04], [rnd(700, 820), 0.5, 0.03], [rnd(1300, 1600), 0.3, 0.02]]));
    jouerSfx(ctx, G, layer, t, buf, { gain: o.gain, pan: o.pan, send: 0.6, lp: 3000 });
  }
  function marteauBois(ctx, G, layer, t, o) {
    o = Object.assign({ gain: 0.05, pan: rnd(-0.6, 0.6) }, o || {});
    const n = 2 + Math.floor(Math.random() * 3);
    const buf = sfxBuffer(ctx, n * 0.8 + 1, (d, sr, L) => {
      const x = new Float32Array(L); let tt = 0;
      for (let k = 0; k < n; k++) { const i0 = Math.floor(tt * sr), a = rnd(0.7, 1); for (let i = 0; i < 0.0015 * sr; i++) x[i0 + i] += a * (Math.random() * 2 - 1); tt += rnd(0.4, 0.75); }
      resonner(x, d, sr, [[rnd(170, 210), 1, 0.07], [rnd(480, 560), 0.6, 0.05], [rnd(1000, 1200), 0.35, 0.03], [2600, 0.15, 0.01]]);
    });
    jouerSfx(ctx, G, layer, t, buf, { gain: o.gain, pan: o.pan, send: 1.1, lp: 1800 });
  }
  /* Carillon de bambou : quelques coups de bois creux, accordés sur l'accord, quand le vent souffle */
  function carillonBambou(ctx, G, layer, t, dur, notes, o) {
    o = Object.assign({ gain: 0.03, gusts: 2, transpose: 24 }, o || {});
    for (let g = 0; g < o.gusts; g++) {
      const t0 = t + dur * (g + rnd(0.15, 0.75)) / o.gusts, n = 3 + Math.floor(Math.random() * 4);
      const buf = sfxBuffer(ctx, n * 0.3 + 1, (d, sr) => {
        let tt = 0;
        for (let k = 0; k < n; k++) {
          const f = mtof(pick(notes) + o.transpose), a = rnd(0.4, 1) * (1 - k / (n + 2)), dec = rnd(0.12, 0.25);
          ping(d, sr, tt, f, a, dec); ping(d, sr, tt, f * 3.1, a * 0.25, dec * 0.4); ping(d, sr, tt, f * 5.2, a * 0.1, dec * 0.2);
          const i0 = Math.floor(tt * sr); for (let i = 0; i < 0.001 * sr; i++) d[i0 + i] += a * 0.3 * (Math.random() * 2 - 1);
          tt += rnd(0.06, 0.3);
        }
      });
      jouerSfx(ctx, G, layer, t0, buf, { gain: o.gain, pan: rnd(-0.7, 0.7), send: 0.6, lp: 5000 });
    }
  }
  function goutte(ctx, G, layer, t, o) {
    o = Object.assign({ gain: 0.022, pan: rnd(-0.6, 0.6) }, o || {});
    const n = 1 + Math.floor(Math.random() * 4);
    const buf = sfxBuffer(ctx, n * 1.1 + 0.5, (d, sr) => {
      let tt = 0;
      for (let k = 0; k < n; k++) { const i0 = Math.floor(tt * sr), f0 = rnd(700, 1400), dec = rnd(0.02, 0.04); let ph = 0; for (let i = 0; i < dec * 6 * sr && i0 + i < d.length; i++) { const s = i / sr; ph += 2 * Math.PI * f0 * (1 + 0.6 * Math.min(1, s / 0.025)) / sr; d[i0 + i] += Math.sin(ph) * Math.exp(-s / dec); } tt += rnd(0.3, 1.1); }
    });
    jouerSfx(ctx, G, layer, t, buf, { gain: o.gain, pan: o.pan, send: 0.6 });
  }

  /* ---------- Lecteur par mesure ---------- */

  function Player(theme) {
    this.theme = theme; this.ctx = null; this.G = null; this.timer = null; this.nextBar = 0; this.t0 = 0;
    this.layerOn = Object.fromEntries(((theme.mix && theme.mix.couches) || ['fond', 'rythmique', 'basse', 'harmonie', 'effets']).map((k) => [k, true]));
    this.onBar = null; this.onStop = null;
  }
  Player.prototype.barDur = function () { return 240 / this.theme.bpm; };
  Player.prototype.start = function (ctx, fromBar) {
    this.ctx = ctx; this.G = buildGraph(ctx, this.theme.mix); this.applyLayers();
    const first = this.nextBar = fromBar || 0; this.t0 = ctx.currentTime + 1.0 - this.nextBar * this.barDur(); /* 1 s de marge : les nappes commencent avant le temps */
    const tick = () => {
      if (!this.ctx) return;
      /* Boucle (écran titre) : arrivé à la fin de la boucle, on repart à son début, sans trou */
      if (this.boucler && this.theme.boucle && this.nextBar >= this.theme.boucle[1]) { const [a, z] = this.theme.boucle; this.t0 += (z - a) * this.barDur(); this.nextBar = a; }
      while (this.nextBar < this.theme.bars && this.t0 + this.nextBar * this.barDur() < this.ctx.currentTime + 1.6) {
        this.theme.bar(this.ctx, this.G, this.nextBar, this.t0 + this.nextBar * this.barDur(), lib, this.nextBar === first);
        this.nextBar++;
      }
      const cur = Math.floor((this.ctx.currentTime - this.t0) / this.barDur());
      if (this.onBar) this.onBar(Math.max(0, Math.min(cur, this.theme.bars - 1)), this.ctx.currentTime - this.t0);
      if (!this.boucler && this.ctx.currentTime > this.t0 + this.theme.bars * this.barDur() + 7) this.stop();
    };
    tick(); this.timer = setInterval(tick, 80);
  };
  Player.prototype.applyLayers = function () {
    if (!this.G) return;
    Object.keys(this.layerOn).forEach((k) => this.G.setLayer(k, this.layerOn[k], this.ctx.currentTime));
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
    Object.keys(G.layers).forEach((k) => G.setLayer(k, !(layerOn && layerOn[k] === false)));
    const bd = 240 / theme.bpm;
    for (let b = 0; b < theme.bars; b++) theme.bar(ctx, G, b, 1.0 + b * bd, lib, b === 0);
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

  const lib = { mtof, rnd, pick, nappe, metalFrotte, verreElectrique, harmonium, sousBasse, grains, braises, vent, courant, enclumeLointaine, borne, bois, roueLibre, ressortFrotte, fragment,
    souffleAccorde, feuillage, grincementMetal, chaine, chocLointain, ticMetal, arcElectrique, verreTinte, relais, neon, oiseau, craquementBois, marteauBois, goutte, carillonBambou, ondeDouce,
    buildGraph, voiceOut, swell, sfxBuffer, jouerSfx, resonner, ping, frottement, noiseBuffer, noiseLong, toWav };
  window.WattMusique = { Player, renderWav, lib };
})();
