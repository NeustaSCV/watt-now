/* Watt Now? — les sons de la Coopérative du Plateau, PROVISOIRES, synthétisés (Book 23).
   Comme à la halte : la musique emprunte la matière du lieu — le bois des palettes, les montants des rayonnages,
   le grain qui coule d'une trémie, la bascule à camions, la tôle du hangar qui travaille au soleil.
   Ce ne sont pas les effets du jeu (session son) : ce sont des timbres de musique, accordés.
   Chaque générateur renvoie un AudioBuffer mono, normalisé à sa crête. */
(function () {
  'use strict';
  const L = window.WattMusique.lib, rnd = L.rnd, mtof = L.mtof;

  /* Palette frappée : bois sec et creux, accordé (modes d'une planche : 1, 2,3, 4,1) */
  function palette(ctx, midi, force) {
    const f = mtof(midi), a = force == null ? 1 : force;
    return L.sfxBuffer(ctx, 0.7, (d, sr, Ln) => {
      const x = new Float32Array(Ln); for (let i = 0; i < 0.002 * sr; i++) x[i] = (Math.random() * 2 - 1) * a * (1 - i / (0.002 * sr));
      L.resonner(x, d, sr, [[f, 1, 0.09], [f * 2.32, 0.45, 0.05], [f * 4.1, 0.2, 0.025], [rnd(1400, 1900), 0.25, 0.008]]);
    });
  }
  /* Montant de rayonnage frappé : acier long, partiels inharmoniques, un peu de « tôle » au départ */
  function rayonnage(ctx, midi, force) {
    const f = mtof(midi), a = force == null ? 1 : force;
    return L.sfxBuffer(ctx, 1.6, (d, sr, Ln) => {
      const x = new Float32Array(Ln); for (let i = 0; i < 0.0015 * sr; i++) x[i] = (Math.random() * 2 - 1) * a;
      L.resonner(x, d, sr, [[f, 1, 0.5], [f * 2.76, 0.5, 0.3], [f * 5.4, 0.3, 0.15], [f * 8.93, 0.15, 0.08]]);
    });
  }
  /* Grain qui coule d'une trémie : pluie de petits chocs, dense puis qui s'épuise */
  function grainCoule(ctx, sec) {
    sec = sec || 1.6;
    return L.sfxBuffer(ctx, sec + 0.2, (d, sr) => {
      const n = Math.floor(sec * 900);
      for (let k = 0; k < n; k++) {
        const t = sec * Math.pow(Math.random(), 1.3), i0 = Math.floor(t * sr), a = rnd(0.2, 1) * (1 - t / sec * 0.7), f = rnd(2500, 6000);
        for (let i = 0; i < 0.0015 * sr && i0 + i < d.length; i++) d[i0 + i] += a * Math.sin(2 * Math.PI * f * i / sr) * Math.exp(-i / (0.0004 * sr));
      }
    });
  }
  /* La bascule à camions : le plateau d'acier qui retombe, sourd, et l'aiguille du cadran qui oscille */
  function bascule(ctx) {
    return L.sfxBuffer(ctx, 2.2, (d, sr, Ln) => {
      const x = new Float32Array(Ln); for (let i = 0; i < 0.008 * sr; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / (0.008 * sr));
      const f0 = rnd(52, 60);
      L.resonner(x, d, sr, [[f0, 1, 0.6], [f0 * 1.9, 0.6, 0.4], [f0 * 3.3, 0.3, 0.2], [f0 * 6.1, 0.15, 0.1]]);
      for (let k = 0; k < 5; k++) L.ping(d, sr, 0.25 + k * 0.17, 3200 - k * 120, 0.12 * (1 - k / 5), 0.01);   // l'aiguille
    });
  }
  /* La tôle du hangar qui travaille (dilatation) : un « poc » grave et son ondulation */
  function toleHangar(ctx) {
    return L.sfxBuffer(ctx, 2.5, (d, sr, Ln) => {
      const x = new Float32Array(Ln); for (let i = 0; i < 0.003 * sr; i++) x[i] = Math.random() * 2 - 1;
      const f0 = rnd(70, 95);
      L.resonner(x, d, sr, [[f0, 1, 0.5], [f0 * 1.58, 0.7, 0.35], [f0 * 2.33, 0.4, 0.25], [f0 * 3.7, 0.25, 0.12]]);
    });
  }

  window.WattCoop = { palette, rayonnage, grainCoule, bascule, toleHangar };
})();
