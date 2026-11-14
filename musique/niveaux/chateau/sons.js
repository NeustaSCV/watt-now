/* Watt Now? — kit de niveau « Château » : les sons du lieu (stem « matiere »), synthétisés et accordés.
   Ils sont REMPLAÇABLES : une autre matière (abbaye, ruine…) peut prendre leur place sans toucher à la musique de base.
   Chaque générateur renvoie un AudioBuffer mono, normalisé à sa crête. */
(function () {
  'use strict';
  const L = window.WattMusique.lib, rnd = L.rnd, mtof = L.mtof;

  /* Cloche de bronze (cloche « à tierce mineure ») : bourdon à l'octave basse, fondamentale, tierce mineure, quinte, nominale…
     felee : partiels désaccordés et battements, déclin plus court (la cloche fêlée du Danger) */
  const PARTIELS = [[0.5, 0.6, 6], [1, 0.8, 4], [1.19, 0.7, 3], [1.5, 0.35, 2.5], [2, 1, 2.5], [2.52, 0.4, 1.5], [3, 0.35, 1.2], [4, 0.25, 0.8], [5.33, 0.15, 0.5]];
  function cloche(ctx, midi, force, felee) {
    const f = mtof(midi), a = force == null ? 1 : force, sec = felee ? 4 : 7;
    return L.sfxBuffer(ctx, sec, (d, sr, Ln) => {
      const x = new Float32Array(Ln); for (let i = 0; i < 0.003 * sr; i++) x[i] = (Math.random() * 2 - 1) * a * (1 - i / (0.003 * sr));
      const modes = [];
      PARTIELS.forEach(([r, amp, dec]) => {
        const k = felee ? rnd(0.97, 1.03) : 1, dd = felee ? dec * 0.45 : dec;
        modes.push([f * r * k, amp, dd]);
        if (felee || r >= 1) modes.push([f * r * k * (felee ? rnd(1.006, 1.015) : 1.0015), amp * 0.5, dd]);   // le battement du bronze
      });
      L.resonner(x, d, sr, modes);
      for (let i = 0; i < 0.006 * sr; i++) d[i] += (Math.random() * 2 - 1) * 0.3 * a * (1 - i / (0.006 * sr));   // le battant
    });
  }
  /* Tic et tac d'une grande horloge : bois et laiton, le tac plus grave */
  function tic(ctx, haut) {
    return L.sfxBuffer(ctx, 0.25, (d, sr) => {
      L.ping(d, sr, 0, haut ? rnd(2900, 3300) : rnd(2100, 2400), 1, 0.012);
      L.ping(d, sr, 0, haut ? 1250 : 980, 0.6, 0.03);
      L.ping(d, sr, 0, haut ? 520 : 430, 0.4, 0.05);                       // la caisse de l'horloge
      for (let i = 0; i < 0.0008 * sr; i++) d[i] += (Math.random() * 2 - 1) * 0.6;
    });
  }
  /* Le vent qui siffle dans une meurtrière : un souffle accordé qui monte et retombe (joué par souffleAccorde) */
  function sifflement(ctx, G, couche, t, midi, dur, gain, pan) {
    L.souffleAccorde(ctx, G, couche, t, midi, dur, 1, { couleur: 'flute', gain, attack: dur * 0.4, release: dur * 0.5, pan, send: 0.9, flutter: 0.7 });
  }

  window.WattChateauSons = { cloche, tic, sifflement };
})();
