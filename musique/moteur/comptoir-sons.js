/* Watt Now? — les sons du Comptoir du Carrefour, PROVISOIRES, synthétisés.
   La batterie du groove est faite de la matière du lieu (Book 21 §6.2.2) : tampons encreurs, caisse enregistreuse,
   clic du compteur électrique, papiers. Les mêmes sons servent d'ambiance (effets libres, priorité 3).
   Chaque générateur renvoie un AudioBuffer mono, normalisé à sa crête. */
(function () {
  'use strict';
  const L = window.WattMusique.lib, rnd = L.rnd;

  /* Tampon encreur sur le bois du comptoir : choc sourd du tampon, bois, claque du papier. lourd : la « grosse caisse » */
  function tampon(ctx, lourd) {
    return L.sfxBuffer(ctx, 0.5, (d, sr, Ln) => {
      let ph = 0, lp = 0, hp = 0, prev = 0;
      const f0 = lourd ? 85 : 150, dec = lourd ? 0.09 : 0.05;
      for (let i = 0; i < 0.4 * sr; i++) {
        const s = i / sr, n = Math.random() * 2 - 1;
        ph += 2 * Math.PI * (f0 + f0 * 0.8 * Math.exp(-s / 0.012)) / sr; lp += 0.15 * (n - lp); hp = 0.7 * (hp + n - prev); prev = n;
        d[i] = Math.sin(ph) * Math.exp(-s / dec) * (lourd ? 1 : 0.5) + lp * 1.2 * Math.exp(-s / 0.02) + (lourd ? 0 : hp * 0.6 * Math.exp(-s / 0.035));
      }
      const x = new Float32Array(Ln); for (let i = 0; i < 0.002 * sr; i++) x[i] = Math.random() * 2 - 1;
      L.resonner(x, d, sr, [[rnd(320, 380), 0.5, 0.03], [rnd(780, 900), 0.3, 0.015]]);   // le bois du comptoir
    });
  }
  /* Clic du compteur électrique (un relais à disque) : le « charleston » */
  function compteurElec(ctx, force) {
    const a = force == null ? 1 : force;
    return L.sfxBuffer(ctx, 0.12, (d, sr) => { L.ping(d, sr, 0, rnd(5200, 6400), a, 0.005); L.ping(d, sr, 0, rnd(1700, 2100), 0.4 * a, 0.008); for (let i = 0; i < 0.0005 * sr; i++) d[i] += (Math.random() * 2 - 1) * 0.6 * a; });
  }
  /* Caisse enregistreuse : la sonnette, puis le tiroir qui glisse et claque */
  function caisse(ctx, tiroir) {
    return L.sfxBuffer(ctx, 1.8, (d, sr) => {
      L.ping(d, sr, 0, 2637, 1, 0.55); L.ping(d, sr, 0, 2637 * 2.43, 0.35, 0.25); L.ping(d, sr, 0, 2637 * 0.5, 0.15, 0.4);
      if (tiroir) {
        let hp = 0, prev = 0;
        for (let i = Math.floor(0.12 * sr); i < 0.45 * sr; i++) { const s = i / sr - 0.12, n = Math.random() * 2 - 1; hp = 0.85 * (hp + n - prev); prev = n; d[i] += hp * 0.25 * Math.sin(Math.PI * s / 0.33); }
        let ph = 0; for (let i = 0; i < 0.12 * sr; i++) { const s = i / sr; ph += 2 * Math.PI * 140 / sr; d[Math.floor(0.45 * sr) + i] += Math.sin(ph) * 0.7 * Math.exp(-s / 0.03); }
      }
    });
  }
  /* Papiers qu'on range : le « shaker » */
  function papier(ctx) {
    return L.sfxBuffer(ctx, 0.35, (d, sr) => { let hp = 0, prev = 0; for (let i = 0; i < 0.3 * sr; i++) { const s = i / sr, n = Math.random() * 2 - 1; hp = 0.75 * (hp + n - prev); prev = n; d[i] = hp * Math.sin(Math.PI * s / 0.3) * (0.6 + 0.4 * Math.sin(s * 90)); } });
  }

  window.WattComptoir = { tampon, compteurElec, caisse, papier };
})();
