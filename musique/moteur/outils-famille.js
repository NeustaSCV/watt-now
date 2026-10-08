/* Watt Now? — les sons des ateliers de famille (moment-vitrine 4, Book 21 §6.1.1 et §6.3), PROVISOIRES.
   Les mêmes générateurs servent deux fois :
   - comme EFFETS, quand le joueur travaille (rythme libre, jamais calé sur le tempo) ;
   - comme PERCUSSION du thème de famille au complet (stem « outil »), accordés et posés sur la grille 3+3+2.
   « C'est la musique qui emprunte la matière des effets, pas l'inverse » (Book 21 §6.2.3).
   Chaque générateur renvoie un AudioBuffer mono, normalisé à sa crête. */
(function () {
  'use strict';
  const L = window.WattMusique.lib, rnd = L.rnd, mtof = L.mtof;

  /* ---------- 🔥 La forge ---------- */
  /* Marteau sur l'enclume : partiels inharmoniques brillants (le « ting »), choc du marteau. Accordable : note MIDI */
  function enclume(ctx, midi, force) {
    const f0 = mtof(midi || 74), a = force == null ? 1 : force;
    return L.sfxBuffer(ctx, 2.2, (d, sr) => {
      [[1, 1, 0.9], [2.08, 0.6, 0.6], [3.2, 0.45, 0.4], [4.6, 0.3, 0.25], [6.1, 0.18, 0.15], [0.51, 0.25, 0.3]].forEach(([r, g, dec]) => L.ping(d, sr, 0, f0 * r * rnd(0.997, 1.003), g * (0.6 + 0.4 * a), dec * (0.7 + 0.3 * a)));
      let lp = 0; const n = Math.floor(0.025 * sr); for (let i = 0; i < n; i++) { lp += 0.15 * ((Math.random() * 2 - 1) - lp); d[i] += lp * 2.5 * a * (1 - i / n); }
    });
  }
  /* Soufflet : une poussée d'air, grave, qui monte et retombe */
  function soufflet(ctx) {
    return L.sfxBuffer(ctx, 1.3, (d, sr) => {
      let lp = 0, lp2 = 0;
      for (let i = 0; i < 1.2 * sr; i++) { const s = i / sr, n = Math.random() * 2 - 1; lp += 0.06 * (n - lp); lp2 += 0.008 * (n - lp2); const env = s < 0.5 ? Math.pow(s / 0.5, 1.5) : Math.exp(-(s - 0.5) / 0.22); d[i] = (lp - lp2) * env; }
    });
  }
  /* Trempe : le fer chaud dans l'eau, qui siffle */
  function trempe(ctx) {
    return L.sfxBuffer(ctx, 2.6, (d, sr) => {
      let hp = 0, prev = 0, am = 1;
      for (let i = 0; i < 2.5 * sr; i++) { const s = i / sr, n = Math.random() * 2 - 1; hp = 0.93 * (hp + n - prev); prev = n; if (i % 200 === 0) am = 0.5 + Math.random() * 0.5; d[i] = hp * am * Math.min(1, s / 0.02) * Math.exp(-s / 0.8); }
    });
  }

  /* ---------- ⚙️ Le pédalier et la meule ---------- */
  /* Chaîne sur le pignon : petits chocs métalliques réguliers, à la cadence des pédales */
  function chaine(ctx, dur, cadence0, cadence1) {
    return L.sfxBuffer(ctx, dur + 0.2, (d, sr) => {
      let x = 0;
      while (x < dur) {
        const p = x / dur, c = cadence0 + (cadence1 - cadence0) * p;
        L.ping(d, sr, x, rnd(3200, 4400), rnd(0.4, 0.7), 0.012); L.ping(d, sr, x, rnd(1300, 1700), 0.25, 0.02);
        x += 1 / c * rnd(0.92, 1.08);
      }
    });
  }
  /* Roue libre : le cliquet qui ralentit */
  function roueLibre(ctx) {
    return L.sfxBuffer(ctx, 1.8, (d, sr) => { let x = 0, pas = 0.022; while (x < 1.6) { L.ping(d, sr, x, rnd(4800, 5600), 1 - x / 2, 0.006); x += pas; pas *= 1.07; } });
  }
  /* Rayon pincé, accordé : un fil d'acier tendu (partiels presque harmoniques, un peu raides) */
  function rayon(ctx, midi, force) {
    const f = mtof(midi), a = force == null ? 1 : force;
    return L.sfxBuffer(ctx, 1.6, (d, sr) => {
      [[1, 1, 0.45], [2.01, 0.5, 0.3], [3.03, 0.3, 0.2], [4.07, 0.18, 0.12], [5.12, 0.1, 0.08]].forEach(([r, g, dec]) => L.ping(d, sr, 0, f * r, g * a, dec));
      for (let i = 0; i < 0.002 * sr; i++) d[i] += (Math.random() * 2 - 1) * 0.4 * a;
    });
  }
  /* Meule : l'acier sur la pierre, en vagues (les coups de pédale), avec des étincelles */
  function meule(ctx, dur) {
    return L.sfxBuffer(ctx, dur, (d, sr) => {
      let hp = 0, prev = 0, bp = 0;
      for (let i = 0; i < dur * sr; i++) { const s = i / sr, n = Math.random() * 2 - 1; hp = 0.85 * (hp + n - prev); prev = n; bp += 0.3 * (hp - bp); const vague = 0.6 + 0.4 * Math.sin(2 * Math.PI * 1.3 * s); d[i] = bp * vague * Math.min(1, s / 0.15) * Math.min(1, (dur - s) / 0.3); }
      let x = 0.2; while (x < dur - 0.3) { L.ping(d, sr, x, rnd(5000, 8000), rnd(0.1, 0.4), 0.004); x += rnd(0.01, 0.12); }
    });
  }

  /* ---------- ⚡ Le banc de recharge ---------- */
  /* Borne de batterie frappée, accordée : plomb sourd, boîtier en plastique qui résonne */
  function borne(ctx, midi, force) {
    const f = mtof(midi), a = force == null ? 1 : force;
    return L.sfxBuffer(ctx, 0.8, (d, sr, Ln) => {
      [[1, 1, 0.16], [1.83, 0.45, 0.09], [2.9, 0.25, 0.05]].forEach(([r, g, dec]) => L.ping(d, sr, 0, f * r, g * a, dec));
      const x = new Float32Array(Ln); for (let i = 0; i < 0.003 * sr; i++) x[i] = (Math.random() * 2 - 1) * a;
      L.resonner(x, d, sr, [[rnd(180, 230), 0.8, 0.03], [rnd(420, 520), 0.4, 0.02]]);
    });
  }
  /* Pince crocodile : le ressort qui claque, deux petits chocs métalliques */
  function pince(ctx) {
    return L.sfxBuffer(ctx, 0.35, (d, sr) => { [0, rnd(0.012, 0.025)].forEach((t, k) => { L.ping(d, sr, t, rnd(2800, 3600), k ? 0.5 : 1, 0.015); for (let i = 0; i < 0.0008 * sr; i++) d[Math.floor(t * sr) + i] += (Math.random() * 2 - 1) * 0.5; }); });
  }
  function interrupteur(ctx) {
    return L.sfxBuffer(ctx, 0.25, (d, sr) => { L.ping(d, sr, 0, 1900, 0.8, 0.008); L.ping(d, sr, 0, 420, 0.5, 0.02); for (let i = 0; i < 0.001 * sr; i++) d[i] += (Math.random() * 2 - 1) * 0.6; });
  }
  /* Bourdonnement du chargeur (100 Hz et harmoniques, un peu de grésillement) ; bouclable */
  function bourdon(ctx, sec) {
    const b = L.sfxBuffer(ctx, sec, (d, sr, Ln) => {
      const w = 2 * Math.PI * 100 / sr;
      for (let i = 0; i < Ln; i++) { let s = 0; for (let h = 1; h <= 8; h++) s += Math.sin(w * h * i + h * 0.7) / (h * h * 0.6 + 0.4); d[i] = s * (0.9 + 0.1 * Math.sin(i / sr * 2 * Math.PI * 0.3)) + (Math.random() * 2 - 1) * 0.03; }
    });
    b.finBoucle = Math.floor(sec * 100) / 100;     // un nombre entier de périodes de 100 Hz : la boucle ne claque pas
    return b;
  }

  window.WattOutils = { enclume, soufflet, trempe, chaine, roueLibre, rayon, meule, borne, pince, interrupteur, bourdon };
})();
