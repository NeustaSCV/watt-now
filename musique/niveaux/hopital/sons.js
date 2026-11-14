/* Watt Now? — kit de niveau « Hôpital » : les sons du lieu (stem « matiere »), synthétisés et accordés sur si♭.
   Remplaçables : une autre matière (clinique, dispensaire…) peut prendre leur place sans toucher à la musique de base. */
(function () {
  'use strict';
  const L = window.WattMusique.lib, rnd = L.rnd, mtof = L.mtof;

  /* Le bip du moniteur cardiaque : un sinus pur, attaque nette, accordé (si♭5 ≈ 932 Hz, le son des moniteurs) */
  function bip(ctx, midi, dur) {
    const f = mtof(midi == null ? 82 : midi), d0 = dur || 0.11;
    return L.sfxBuffer(ctx, d0 + 0.05, (d, sr) => { for (let i = 0; i < d.length; i++) { const s = i / sr; d[i] = Math.sin(2 * Math.PI * f * s) * Math.min(1, s / 0.002) * Math.min(1, Math.max(0, (d0 - s) / 0.01)); } });
  }
  /* Les néons : ronflement ramené au si♭ (≈ 116,5 Hz, l'octave du si♭ 58 Hz), riche en harmoniques, qui papillote parfois */
  function neon(ctx, G, couche, t, dur, gain, pan, papillote) {
    const amp = L.voiceOut(ctx, G, couche, pan || 0, 0.15);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200; lp.connect(amp);
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(46) * 2; o.connect(lp);
    const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = mtof(46) * 4; const g2 = ctx.createGain(); g2.gain.value = 0.2; o2.connect(g2); g2.connect(lp);
    L.swell(amp, t, 1.5, gain, t + dur, 1.5);
    if (papillote) for (let x = rnd(1, 3); x < dur - 1; x += rnd(2, 6)) { const tt = t + x; amp.gain.setValueAtTime(gain * 0.15, tt); amp.gain.setValueAtTime(gain, tt + rnd(0.03, 0.09)); amp.gain.setValueAtTime(gain * 0.3, tt + 0.13); amp.gain.setValueAtTime(gain, tt + 0.18); }
    [o, o2].forEach((x) => { x.start(t); x.stop(t + dur + 1.6); });
  }
  /* La ventilation : un souffle large et égal, un peu de grave */
  function ventilation(ctx, G, couche, t, dur, gain, pan) {
    const nz = ctx.createBufferSource(); nz.buffer = L.noiseLong(ctx); nz.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.4;
    const amp = L.voiceOut(ctx, G, couche, pan || 0, 0.3); nz.connect(bp); bp.connect(amp);
    L.swell(amp, t, 2, gain, t + dur, 2); nz.start(t, rnd(0, 10)); nz.stop(t + dur + 2.5);
  }
  /* Un chariot qu'on pousse au loin : une roulette qui couine, les instruments qui tremblent */
  function chariot(ctx) {
    const sec = 2.4;
    return L.sfxBuffer(ctx, sec, (d, sr, Ln) => {
      const x = L.frottement(sr, Ln, sec - 0.3, rnd(9, 14), rnd(20, 30));
      L.resonner(x, d, sr, [[rnd(1400, 1700), 1, 0.05], [rnd(2900, 3300), 0.4, 0.03]]);
      for (let k = 0, t = 0.1; t < sec - 0.4; k++, t += rnd(0.08, 0.2)) L.ping(d, sr, t, rnd(3500, 6000), rnd(0.1, 0.3), 0.02);
    });
  }
  /* Une porte battante qui se rabat : choc sourd, puis le battant qui oscille et grince */
  function porte(ctx) {
    return L.sfxBuffer(ctx, 2.2, (d, sr, Ln) => {
      const x = new Float32Array(Ln); for (let i = 0; i < 0.01 * sr; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / (0.01 * sr));
      L.resonner(x, d, sr, [[rnd(90, 120), 1, 0.25], [rnd(230, 280), 0.5, 0.12], [rnd(600, 750), 0.2, 0.05]]);
      [0.45, 0.9, 1.25].forEach((t, k) => { const i0 = Math.floor(t * sr); for (let i = 0; i < 0.006 * sr; i++) d[i0 + i] += (Math.random() * 2 - 1) * 0.3 / (k + 1); });
    });
  }
  /* L'appel d'infirmière : deux notes en quarte (fa, si♭), le timbre doux des carillons d'hôpital */
  function appel(ctx) {
    return L.sfxBuffer(ctx, 2.6, (d, sr) => [[77, 0], [70, 0.5]].forEach(([m, t]) => { const f = mtof(m); L.ping(d, sr, t, f, 1, 1.1); L.ping(d, sr, t, f * 2, 0.15, 0.5); L.ping(d, sr, t, f * 3, 0.05, 0.3); }));
  }

  window.WattHopitalSons = { bip, neon, ventilation, chariot, porte, appel };
})();
