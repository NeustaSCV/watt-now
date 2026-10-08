/* Watt Now? — les sons de la halte (la station-service), PROVISOIRES, synthétisés.
   Comme pour les ateliers : la musique d'Exploration emprunte la matière du lieu (Book 21 §6.2.2) —
   le compteur à rouleaux de la pompe, le tuyau, les bidons, une guitare préparée, la cuve, l'auvent, le néon mort.
   Chaque générateur renvoie un AudioBuffer mono, normalisé à sa crête. */
(function () {
  'use strict';
  const L = window.WattMusique.lib, rnd = L.rnd, mtof = L.mtof;

  /* Un cran du compteur à rouleaux : petit choc de plastique et de métal */
  function compteurClic(ctx, force) {
    const a = force == null ? 1 : force;
    return L.sfxBuffer(ctx, 0.15, (d, sr) => { L.ping(d, sr, 0, rnd(2600, 3300), a, 0.008); L.ping(d, sr, 0, rnd(420, 520), 0.5 * a, 0.012); for (let i = 0; i < 0.0007 * sr; i++) d[i] += (Math.random() * 2 - 1) * 0.5 * a; });
  }
  /* Le compteur qui roule : plusieurs chiffres tournent ensemble, une cascade de crans et le frottement des engrenages */
  function compteurRoule(ctx) {
    return L.sfxBuffer(ctx, 0.7, (d, sr) => {
      let t = 0; const n = 4 + Math.floor(Math.random() * 4);
      for (let k = 0; k < n; k++) { L.ping(d, sr, t, rnd(2400, 3400), rnd(0.5, 1), 0.007); L.ping(d, sr, t, rnd(380, 560), 0.3, 0.01); t += rnd(0.025, 0.05); }
      let hp = 0, prev = 0; for (let i = 0; i < t * sr; i++) { const n2 = Math.random() * 2 - 1; hp = 0.8 * (hp + n2 - prev); prev = n2; d[i] += hp * 0.08; }
    });
  }
  /* Bidon (jerrican) frappé, accordé : coque creuse, un peu de liquide qui bouge */
  function bidon(ctx, midi, force) {
    const f = mtof(midi), a = force == null ? 1 : force;
    return L.sfxBuffer(ctx, 0.9, (d, sr, Ln) => {
      const x = new Float32Array(Ln); for (let i = 0; i < 0.004 * sr; i++) x[i] = (Math.random() * 2 - 1) * a * (1 - i / (0.004 * sr));
      L.resonner(x, d, sr, [[f, 1, 0.12], [f * 1.71, 0.5, 0.07], [f * 2.9, 0.25, 0.04], [rnd(900, 1200), 0.15, 0.015]]);
      let lp = 0; for (let i = Math.floor(0.03 * sr); i < 0.5 * sr; i++) { lp += 0.02 * ((Math.random() * 2 - 1) - lp); d[i] += lp * 0.4 * a * Math.sin(Math.PI * (i / sr - 0.03) / 0.47); }
    });
  }
  /* Le tuyau de la pompe qui claque sur le béton : caoutchouc mat */
  function tuyau(ctx) {
    return L.sfxBuffer(ctx, 0.4, (d, sr) => { let lp = 0, ph = 0; for (let i = 0; i < 0.3 * sr; i++) { const s = i / sr; lp += 0.12 * ((Math.random() * 2 - 1) - lp); ph += 2 * Math.PI * (160 + 120 * Math.exp(-s / 0.01)) / sr; d[i] = (lp * 2 + Math.sin(ph) * 0.5) * Math.exp(-s / 0.04); } });
  }
  /* Guitare préparée : corde pincée (Karplus-Strong) avec un trombone glissé entre les cordes, qui frise */
  function guitarePreparee(ctx, midi, force, frise) {
    const f = mtof(midi), a = force == null ? 1 : force, fr = frise == null ? 0.35 : frise;
    return L.sfxBuffer(ctx, 2.2, (d, sr, Ln) => {
      const N = Math.max(2, Math.round(sr / f)), ligne = new Float32Array(N);
      let p = 0; for (let i = 0; i < N; i++) { p += ((Math.random() * 2 - 1) - p) * 0.6; ligne[i] = p * a; }
      let idx = 0, hp = 0, prev = 0;
      for (let i = 0; i < Ln; i++) {
        const cur = ligne[idx]; ligne[idx] = 0.996 * 0.5 * (cur + ligne[(idx + 1) % N]); idx = (idx + 1) % N;
        const n = Math.random() * 2 - 1; hp = 0.6 * (hp + n - prev); prev = n;
        d[i] = cur + fr * Math.abs(cur) * hp * 2.5;                    // la frisure : du bruit métallique qui suit l'amplitude de la corde
      }
    });
  }
  /* L'auvent de tôle dans le vent : grondement, battements de tôle, cliquetis */
  function auvent(ctx, sec) {
    return L.sfxBuffer(ctx, sec, (d, sr, Ln) => {
      let lp = 0, lp2 = 0; const f1 = rnd(0.07, 0.12);
      for (let i = 0; i < Ln; i++) { const s = i / sr, n = Math.random() * 2 - 1; lp += 0.03 * (n - lp); lp2 += 0.004 * (n - lp2); d[i] = (lp - lp2) * (0.5 + 0.4 * Math.max(0, Math.sin(2 * Math.PI * f1 * s))); }
      let t = rnd(1, 3);
      while (t < sec - 1) {
        const bat = 2 + Math.floor(Math.random() * 4), f0 = rnd(70, 110);
        for (let k = 0; k < bat; k++) { [[1, 1, 0.25], [2.3, 0.5, 0.12], [4.1, 0.3, 0.06]].forEach(([r, g, dec]) => L.ping(d, sr, t + k * 0.09, f0 * r, g * 0.6 * (1 - k / (bat + 1)), dec)); }
        t += rnd(2, 6);
      }
    });
  }
  /* Le néon mort : il tente de s'allumer (quelques crépitements de ballast), puis rien */
  function neonMort(ctx) {
    return L.sfxBuffer(ctx, 2, (d, sr) => {
      let t = 0.05;
      for (let k = 0; k < 3 + Math.floor(Math.random() * 3); k++) {
        const len = rnd(0.03, 0.12), i0 = Math.floor(t * sr), w = 2 * Math.PI * 100 / sr;
        for (let i = 0; i < len * sr; i++) { let s = 0; for (let h = 1; h <= 10; h++) s += Math.sin(w * h * (i0 + i)) / h; d[i0 + i] += s * 0.5 + (Math.random() * 2 - 1) * 0.15; }
        L.ping(d, sr, t, 2100, 0.6, 0.006);
        t += len + rnd(0.08, 0.35);
      }
    });
  }

  window.WattHalte = { compteurClic, compteurRoule, bidon, tuyau, guitarePreparee, auvent, neonMort };
})();
