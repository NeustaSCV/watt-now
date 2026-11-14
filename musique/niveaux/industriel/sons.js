/* Watt Now? — kit de niveau « Industriel » : les sons du lieu (stem « matiere »), synthétisés et accordés sur si.
   Remplaçables : une autre matière (usine chimique, chantier naval…) peut prendre leur place sans toucher à la musique de base. */
(function () {
  'use strict';
  const L = window.WattMusique.lib, rnd = L.rnd, mtof = L.mtof;

  /* Piston : un coup sourd de fonte, puis la vapeur qui s'échappe */
  function piston(ctx, force) {
    const a = force == null ? 1 : force;
    return L.sfxBuffer(ctx, 0.9, (d, sr, Ln) => {
      const x = new Float32Array(Ln); for (let i = 0; i < 0.006 * sr; i++) x[i] = (Math.random() * 2 - 1) * a;
      L.resonner(x, d, sr, [[rnd(70, 80), 1, 0.12], [rnd(180, 210), 0.5, 0.06], [rnd(900, 1100), 0.15, 0.02]]);
      let hp = 0, prev = 0;
      for (let i = Math.floor(0.08 * sr); i < 0.6 * sr; i++) { const n = Math.random() * 2 - 1; hp = 0.9 * (hp + n - prev); prev = n; const s = i / sr - 0.08; d[i] += hp * 0.25 * a * Math.exp(-s / 0.12) * Math.min(1, s / 0.02); }
    });
  }
  /* Vapeur qui fuit : un long souffle aigu */
  function vapeur(ctx, sec) {
    sec = sec || 2;
    return L.sfxBuffer(ctx, sec, (d, sr) => { let hp = 0, prev = 0; for (let i = 0; i < d.length; i++) { const s = i / sr, n = Math.random() * 2 - 1; hp = 0.95 * (hp + n - prev); prev = n; d[i] = hp * Math.min(1, s / 0.15) * Math.min(1, (sec - s) / 0.6); } });
  }
  /* Marteau-pilon : un choc énorme, et l'acier qui sonne */
  function marteau(ctx) {
    return L.sfxBuffer(ctx, 2.5, (d, sr, Ln) => {
      const x = new Float32Array(Ln); for (let i = 0; i < 0.012 * sr; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / (0.012 * sr));
      const f0 = mtof(35);                                              // si grave
      L.resonner(x, d, sr, [[f0, 1, 0.5], [f0 * 2.02, 0.6, 0.35], [f0 * 3.7, 0.4, 0.4], [f0 * 6.1, 0.3, 0.6], [f0 * 9.3, 0.2, 0.5]]);
    });
  }
  /* La chaîne du convoyeur : un cliquetis de maillons */
  function maillons(ctx) {
    return L.sfxBuffer(ctx, 0.4, (d, sr) => { for (let k = 0; k < 6; k++) { const t = k * rnd(0.025, 0.04); L.ping(d, sr, t, rnd(1800, 3000), rnd(0.3, 1), 0.04); L.ping(d, sr, t, rnd(400, 600), 0.3, 0.03); } });
  }
  /* Le ronflement des transformateurs : si (≈ 61,7 Hz, presque le 60 Hz du secteur), riche en harmoniques */
  function ronflement(ctx, G, couche, t, dur, gain, pan) {
    const amp = L.voiceOut(ctx, G, couche, pan || 0, 0.15);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600; lp.connect(amp);
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(35); o.connect(lp);
    const o2 = ctx.createOscillator(); o2.frequency.value = mtof(47); const g2 = ctx.createGain(); g2.gain.value = 0.5; o2.connect(g2); g2.connect(amp);
    L.swell(amp, t, 2, gain, t + dur, 2); [o, o2].forEach((x) => { x.start(t); x.stop(t + dur + 2.2); });
  }
  /* Sirène : deux sinus qui montent et descendent (do♯ – fa♯ – si), lointaine ou tout près */
  function sirene(ctx, G, couche, t, dur, gain, pan) {
    const amp = L.voiceOut(ctx, G, couche, pan || 0, 0.7);
    [[1, 1], [1.5, 0.4]].forEach(([r, a]) => {
      const o = ctx.createOscillator(); o.type = 'triangle'; const g = ctx.createGain(); g.gain.value = a; o.connect(g); g.connect(amp);
      const f0 = mtof(61) * r, f1 = mtof(66) * r;
      o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f1, t + dur * 0.35); o.frequency.setValueAtTime(f1, t + dur * 0.6); o.frequency.linearRampToValueAtTime(mtof(59) * r, t + dur);
      o.start(t); o.stop(t + dur + 0.5);
    });
    L.swell(amp, t, dur * 0.3, gain, t + dur * 0.8, dur * 0.25);
  }
  /* Tôle frappée (Danger) */
  function tole(ctx) {
    const f0 = rnd(110, 150);
    return L.sfxBuffer(ctx, 1.4, (d, sr, Ln) => {
      const x = new Float32Array(Ln); for (let i = 0; i < 0.004 * sr; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / (0.004 * sr));
      L.resonner(x, d, sr, [[f0, 1, 0.4], [f0 * 1.58, 0.8, 0.3], [f0 * 2.33, 0.6, 0.2], [f0 * 3.1, 0.4, 0.15], [f0 * 4.4, 0.3, 0.1]]);
    });
  }

  window.WattIndustrielSons = { piston, vapeur, marteau, maillons, ronflement, sirene, tole };
})();
