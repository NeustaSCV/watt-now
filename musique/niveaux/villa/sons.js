/* Watt Now? — kit de niveau « Villa » : les sons du lieu (stem « matiere »), synthétisés.
   Remplaçables : une autre matière (manoir, hôtel…) peut prendre leur place sans toucher à la musique de base. */
(function () {
  'use strict';
  const L = window.WattMusique.lib, rnd = L.rnd, mtof = L.mtof;

  /* L'eau de la piscine qui clapote contre le bord : bruit grave filtré, vagues lentes et petits « plocs » */
  function piscine(ctx, G, couche, t, dur, gain, pan) {
    const nz = ctx.createBufferSource(); nz.buffer = L.noiseLong(ctx); nz.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 0.9;
    const vague = ctx.createGain(); vague.gain.value = 0.5;
    [[0.23, 0.35], [0.61, 0.2], [1.7, 0.1]].forEach(([f, p]) => { const o = ctx.createOscillator(); o.frequency.value = f * rnd(0.9, 1.1); const g = ctx.createGain(); g.gain.value = p; o.connect(g); g.connect(vague.gain); o.start(t); o.stop(t + dur + 3); });
    const amp = L.voiceOut(ctx, G, couche, pan || 0, 0.4);
    nz.connect(bp); bp.connect(vague); vague.connect(amp); L.swell(amp, t, 2, gain, t + dur, 2);
    nz.start(t, rnd(0, 10)); nz.stop(t + dur + 3);
    for (let x = rnd(0.3, 1.5); x < dur; x += rnd(0.6, 2.2)) L.jouerSfx(ctx, G, couche, t + x, ploc(ctx), { gain: gain * rnd(1.5, 3), pan: (pan || 0) + rnd(-0.3, 0.3), send: 0.4 });
  }
  function ploc(ctx) {
    return L.sfxBuffer(ctx, 0.25, (d, sr) => { let ph = 0; for (let i = 0; i < 0.2 * sr; i++) { const s = i / sr, f = 700 + 900 * Math.exp(-s / 0.02); ph += 2 * Math.PI * f / sr; d[i] = Math.sin(ph) * Math.exp(-s / 0.03); } });
  }
  /* La fontaine du hall : eau continue, plus aiguë */
  function fontaine(ctx, G, couche, t, dur, gain, pan) {
    const nz = ctx.createBufferSource(); nz.buffer = L.noiseLong(ctx); nz.loop = true;
    const hp = ctx.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = 2600; hp.Q.value = 0.6;
    const amp = L.voiceOut(ctx, G, couche, pan || 0, 0.5);
    nz.connect(hp); hp.connect(amp); L.swell(amp, t, 2, gain, t + dur, 2); nz.start(t, rnd(0, 10)); nz.stop(t + dur + 2.5);
  }
  /* Le carillon de la porte : deux notes de métal tendre (la, puis fa), comme une sonnette de luxe */
  function carillon(ctx, notes) {
    return L.sfxBuffer(ctx, 3.5, (d, sr) => (notes || [69, 65]).forEach((m, k) => { const f = mtof(m); [[1, 1, 1.6], [2.76, 0.35, 0.6], [5.4, 0.12, 0.3]].forEach(([r, a, dec]) => L.ping(d, sr, k * 0.55, f * r, a, dec)); }));
  }
  /* Volet roulant électrique : un moteur qui ronronne et monte un peu, les lames qui cliquettent */
  function volet(ctx) {
    const sec = 3.2;
    return L.sfxBuffer(ctx, sec, (d, sr) => {
      let ph = 0;
      for (let i = 0; i < (sec - 0.2) * sr; i++) {
        const s = i / sr, f = 95 + 12 * (s / sec), env = Math.min(1, s / 0.15) * Math.min(1, (sec - 0.2 - s) / 0.2);
        ph += 2 * Math.PI * f / sr;
        d[i] = env * (0.5 * Math.sign(Math.sin(ph)) * 0.3 + 0.4 * Math.sin(ph * 2) + 0.1 * (Math.random() * 2 - 1));
      }
      for (let k = 0, t = 0.2; t < sec - 0.4; k++, t += rnd(0.14, 0.2)) L.ping(d, sr, t, rnd(2400, 3200), 0.25, 0.01);
    });
  }
  /* Verre qui se brise (Danger) : une gerbe de partiels aigus et un souffle */
  function verreBrise(ctx) {
    return L.sfxBuffer(ctx, 1.6, (d, sr) => {
      for (let k = 0; k < 40; k++) { const t = 0.3 * Math.pow(Math.random(), 2); L.ping(d, sr, t, rnd(2500, 9000), rnd(0.2, 1), rnd(0.03, 0.25)); }
      for (let i = 0; i < 0.25 * sr; i++) d[i] += (Math.random() * 2 - 1) * 0.6 * Math.exp(-i / (0.05 * sr));
    });
  }

  window.WattVillaSons = { piscine, fontaine, carillon, volet, verreBrise, ploc };
})();
