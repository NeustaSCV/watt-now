/* Watt Now? — sons PROVISOIRES des Éteints, du feu de camp et de l'ambiance, pour tester le moteur (Book 21 §6.5.3, étape 3).
   Synthèse simple : les vrais Éteints seront faits à partir de voix retravaillées (§6.5.2).
   Chaque fonction renvoie un AudioBuffer mono ; plusieurs variantes par son (tirées au hasard par le banc d'essai). */
(function () {
  'use strict';
  const L = window.WattMusique.lib, rnd = L.rnd;

  /* Râle : impulsions glottiques irrégulières dans des formants de voix, souffle. coupe : s'interrompt net (Attiré) */
  function rale(ctx, o) {
    o = Object.assign({ duree: rnd(1.1, 2), coupe: false, f0: rnd(62, 95) }, o || {});
    const fin = o.coupe ? o.duree * rnd(0.3, 0.45) : o.duree;
    return L.sfxBuffer(ctx, o.duree + 0.3, (d, sr, Ln) => {
      const x = new Float32Array(Ln);
      let t = 0;
      while (t < fin) {
        const ph = t / o.duree, env = Math.pow(Math.sin(Math.PI * Math.min(1, ph * 1.1)), 0.7);
        const i = Math.floor(t * sr); x[i] += env * rnd(0.6, 1);
        t += (1 / (o.f0 * (1 + 0.15 * Math.sin(ph * 9)))) * rnd(0.8, 1.25);       // hauteur instable, voix abîmée
      }
      for (let i = 0; i < fin * sr; i++) { const ph = i / sr / o.duree; x[i] += (Math.random() * 2 - 1) * 0.02 * Math.sin(Math.PI * Math.min(1, ph)); }
      L.resonner(x, d, sr, [[rnd(420, 600), 1, 0.012], [rnd(950, 1300), 0.7, 0.009], [rnd(2200, 2700), 0.35, 0.006], [rnd(150, 220), 0.5, 0.02]]);
      if (o.coupe) { const i0 = Math.floor(fin * sr); for (let i = i0; i < Ln; i++) d[i] *= Math.max(0, 1 - (i - i0) / (0.012 * sr)); }
    });
  }
  /* Pas : frottement (traînant) ou appui court (pressé), sur la terre */
  function pas(ctx, o) {
    o = Object.assign({ presse: false }, o || {});
    const dur = o.presse ? rnd(0.09, 0.14) : rnd(0.25, 0.4);
    return L.sfxBuffer(ctx, dur + 0.15, (d, sr) => {
      let lp = 0, lp2 = 0;
      for (let i = 0; i < dur * sr; i++) {
        const s = i / sr / dur, env = o.presse ? Math.exp(-s * 4) : Math.pow(Math.sin(Math.PI * s), 0.8);
        const n = Math.random() * 2 - 1; lp += 0.25 * (n - lp); lp2 += 0.03 * (n - lp2);
        d[i] = env * (lp * 0.6 + lp2 * (o.presse ? 4 : 2) * (s < 0.2 ? 1 : 0.3));
      }
    });
  }
  /* Saisie : agrippement (tissu), souffle court */
  function saisie(ctx) {
    return L.sfxBuffer(ctx, 0.9, (d, sr) => {
      let hp = 0, prev = 0;
      for (let i = 0; i < 0.7 * sr; i++) { const s = i / sr, n = Math.random() * 2 - 1; hp = 0.9 * (hp + n - prev); prev = n; const am = 0.5 + 0.5 * Math.sin(2 * Math.PI * rnd(18, 26) * s); d[i] = hp * am * Math.exp(-s / 0.25) * Math.min(1, s / 0.005); }
    });
  }
  /* Coup sourd, puis chute du corps */
  function coup(ctx) {
    return L.sfxBuffer(ctx, 0.5, (d, sr) => {
      let ph = 0, lp = 0;
      for (let i = 0; i < 0.4 * sr; i++) { const s = i / sr; ph += 2 * Math.PI * (55 + 60 * Math.exp(-s / 0.03)) / sr; lp += 0.1 * ((Math.random() * 2 - 1) - lp); d[i] = (Math.sin(ph) * 0.8 + lp * 2) * Math.exp(-s / 0.08); }
    });
  }
  function chute(ctx) {
    return L.sfxBuffer(ctx, 1.4, (d, sr) => {
      [0, rnd(0.12, 0.2), rnd(0.35, 0.5)].forEach((t0, k) => {
        let ph = 0, lp = 0; const i0 = Math.floor(t0 * sr), a = [1, 0.6, 0.35][k];
        for (let i = 0; i < 0.35 * sr; i++) { const s = i / sr; ph += 2 * Math.PI * (45 + 40 * Math.exp(-s / 0.04)) / sr; lp += 0.06 * ((Math.random() * 2 - 1) - lp); d[i0 + i] += a * (Math.sin(ph) * 0.7 + lp * 3) * Math.exp(-s / 0.1); }
      });
    });
  }
  /* Respiration lente du Dormant */
  function respiration(ctx) {
    return L.sfxBuffer(ctx, 3.2, (d, sr) => {
      let bp = 0, lp = 0;
      for (let i = 0; i < 3 * sr; i++) { const s = i / sr, env = Math.pow(Math.max(0, Math.sin(Math.PI * s / 1.4)), 2) * (s < 1.4 ? 1 : 0) + Math.pow(Math.max(0, Math.sin(Math.PI * (s - 1.6) / 1.4)), 2) * (s > 1.6 ? 0.8 : 0); const n = Math.random() * 2 - 1; lp += 0.2 * (n - lp); bp += 0.02 * (lp - bp); d[i] = (lp - bp) * env; }
    });
  }

  /* ---------- Ambiance (bus environnement, jamais calée sur le tempo) ---------- */
  function oiseau(ctx) {
    const sp = L.pick(['siffle', 'trille', 'appel']);
    return L.sfxBuffer(ctx, 2.2, (d, sr) => {
      const chirp = (t0, len, fA, fB, fm, fmd) => { const i0 = Math.floor(t0 * sr), n = Math.floor(len * sr); let ph = 0; for (let i = 0; i < n && i0 + i < d.length; i++) { const x = i / n, f = fA + (fB - fA) * (x * x * (3 - 2 * x)) + (fm ? fmd * Math.sin(2 * Math.PI * fm * i / sr) : 0); ph += 2 * Math.PI * f / sr; d[i0 + i] += Math.pow(Math.sin(Math.PI * x), 1.5) * Math.sin(ph); } };
      if (sp === 'siffle') { let tt = 0; const n = 2 + Math.floor(Math.random() * 4), f1 = rnd(2600, 3600); for (let k = 0; k < n; k++) { const len = rnd(0.07, 0.14); chirp(tt, len, f1, f1 * rnd(0.6, 0.8)); tt += len + rnd(0.05, 0.12); } }
      else if (sp === 'trille') chirp(0, rnd(0.6, 1.1), rnd(3800, 4400), rnd(3600, 4200), rnd(24, 34), rnd(250, 450));
      else { const f = rnd(2400, 3000); chirp(0, 0.18, f, f * 1.3); chirp(0.3, 0.26, f * 1.2, f * 0.85); }
    });
  }
  function grillon(ctx) {
    const f = rnd(4200, 5200), n = 3 + Math.floor(Math.random() * 3);
    return L.sfxBuffer(ctx, n * 0.05 + 0.1, (d, sr) => { for (let k = 0; k < n; k++) L.ping(d, sr, k * 0.05, f, 1, 0.01); });
  }
  function ventBoucle(ctx, sec) {
    return boucler(L.sfxBuffer(ctx, sec, (d, sr, Ln) => {
      let lp = 0, lp2 = 0; const f1 = rnd(0.05, 0.1), f2 = rnd(0.13, 0.2);
      for (let i = 0; i < Ln; i++) { const s = i / sr, n = Math.random() * 2 - 1; lp += 0.04 * (n - lp); lp2 += 0.004 * (n - lp2); d[i] = (lp - lp2) * (0.6 + 0.25 * Math.sin(2 * Math.PI * f1 * s) + 0.15 * Math.sin(2 * Math.PI * f2 * s + 1)); }
    }), 0.5);
  }


  /* ---------- Le feu de camp (bus joueur, portée ≈ 5 m) ----------
     Grondement sourd qui vacille, souffle aigu, crépitements (beaucoup de petits, quelques gros), claquements de sève. */
  function crepiter(d, sr, t0, t1, taux, force) {
    let x = t0 + rnd(0, 1 / taux);
    while (x < t1) {
      const gros = Math.random() < 0.07, i0 = Math.floor(x * sr), len = Math.floor((gros ? rnd(0.002, 0.006) : rnd(0.0003, 0.0015)) * sr);
      const a = force(x) * (gros ? rnd(0.5, 1) : Math.pow(Math.random(), 2) * 0.5);
      let prev = 0;
      for (let i = 0; i < len && i0 + i < d.length; i++) { const n = Math.random() * 2 - 1; d[i0 + i] += a * (n - prev) * Math.exp(-i / (len * 0.35)); prev = n; }
      if (gros && Math.random() < 0.5) L.ping(d, sr, x, rnd(900, 2200), a * 0.25, rnd(0.006, 0.015));   // claquement de sève
      x += -Math.log(1 - Math.random()) / (taux * (0.5 + Math.random()));                               // rafales irrégulières
    }
  }
  function fondFeu(d, sr, t0, t1, force) {
    let lp = 0, lp2 = 0, hp = 0, prev = 0, fl = 0.7;
    for (let i = Math.floor(t0 * sr); i < Math.floor(t1 * sr) && i < d.length; i++) {
      const s = i / sr, n = Math.random() * 2 - 1;
      lp += 0.025 * (n - lp); lp2 += 0.003 * (n - lp2);
      hp = 0.97 * (hp + n - prev); prev = n;
      if (i % 64 === 0) fl += (Math.random() - 0.5) * 0.06 - (fl - 0.7) * 0.02;                     // la flamme vacille
      d[i] += force(s) * ((lp - lp2) * 3.2 * fl + hp * 0.012);
    }
  }
  /* Bouclage sans clic : le début est fondu avec la fin, et la boucle s'arrête avant cette fin (loopEnd) */
  function boucler(buf, sec) {
    const d = buf.getChannelData(0), Ln = d.length, nf = Math.floor(buf.sampleRate * sec);
    for (let i = 0; i < nf; i++) { const a = i / nf; d[i] = d[i] * a + d[Ln - nf + i] * (1 - a); }
    buf.finBoucle = (Ln - nf) / buf.sampleRate;
    return buf;
  }
  function feuBoucle(ctx, sec) {
    return boucler(L.sfxBuffer(ctx, sec, (d, sr) => { fondFeu(d, sr, 0, sec, () => 1); crepiter(d, sr, 0, sec, 14, () => 1); }), 0.6);
  }
  /* Briquet : la molette (petits clics), l'étincelle, puis la flamme qui s'ouvre */
  function briquet(ctx) {
    return L.sfxBuffer(ctx, 1.4, (d, sr) => {
      for (let k = 0; k < 7; k++) { const i0 = Math.floor((0.02 + k * 0.011) * sr); for (let i = 0; i < 0.0006 * sr; i++) d[i0 + i] += (Math.random() * 2 - 1) * 0.6; }
      crepiter(d, sr, 0.09, 0.16, 120, () => 0.7);
      let bp = 0, lp = 0;
      for (let i = Math.floor(0.14 * sr); i < 1.3 * sr; i++) { const s = i / sr - 0.14, n = Math.random() * 2 - 1; lp += 0.12 * (n - lp); bp += 0.015 * (lp - bp); d[i] += (lp - bp) * 0.9 * Math.min(1, s / 0.06) * Math.exp(-Math.max(0, s - 0.4) / 0.35); }
    });
  }
  /* Le petit bois prend : les crépitements montent, le grondement s'installe (6 s, puis la boucle prend le relais) */
  function allumage(ctx) {
    const sec = 6;
    return L.sfxBuffer(ctx, sec, (d, sr, Ln) => {
      const monte = (s) => Math.min(1, Math.pow(s / 4.5, 1.5));
      fondFeu(d, sr, 0.3, sec, (s) => monte(s) * 0.9);
      crepiter(d, sr, 0.2, sec, 16, (s) => 0.3 + 0.7 * monte(s));
      let hp = 0, prev = 0;   // le papier qui se tord
      for (let i = Math.floor(0.2 * sr); i < 2.5 * sr; i++) { const s = i / sr, n = Math.random() * 2 - 1; hp = 0.9 * (hp + n - prev); prev = n; d[i] += hp * 0.08 * Math.max(0, Math.sin(Math.PI * (s - 0.2) / 2.3)) * (0.5 + 0.5 * Math.sin(s * 37)); }
      const nf = Math.floor(sr * 1.2); for (let i = 0; i < nf; i++) d[Ln - nf + i] *= 1 - i / nf;
    });
  }
  /* Bûche posée sur le feu : choc sourd, gerbe d'étincelles */
  function buche(ctx) {
    return L.sfxBuffer(ctx, 2, (d, sr) => {
      let ph = 0, lp = 0;
      for (let i = 0; i < 0.35 * sr; i++) { const s = i / sr; ph += 2 * Math.PI * (75 + 50 * Math.exp(-s / 0.03)) / sr; lp += 0.08 * ((Math.random() * 2 - 1) - lp); d[i] += (Math.sin(ph) * 0.7 + lp * 2.5) * Math.exp(-s / 0.09); }
      crepiter(d, sr, 0.05, 1.8, 40, (s) => Math.exp(-s / 0.6));
    });
  }
  /* Extinction : la braise siffle et fume */
  function extinction(ctx) {
    return L.sfxBuffer(ctx, 3, (d, sr) => {
      let hp = 0, prev = 0;
      for (let i = 0; i < 2.8 * sr; i++) { const s = i / sr, n = Math.random() * 2 - 1; hp = 0.95 * (hp + n - prev); prev = n; d[i] = hp * 0.5 * Math.min(1, s / 0.05) * Math.exp(-s / 0.9) * (0.7 + 0.3 * Math.sin(s * 23)); }
      crepiter(d, sr, 0, 1, 10, (s) => 0.6 * Math.exp(-s));
    });
  }

  /** Prépare plusieurs variantes de chaque son pour ce contexte */
  function preparer(ctx) {
    const v = (n, f) => Array.from({ length: n }, f);
    return {
      raleErrant: v(6, () => rale(ctx)),
      raleCoupe: v(3, () => rale(ctx, { coupe: true })),
      raleRapproche: v(4, () => rale(ctx, { duree: rnd(0.5, 0.8), f0: rnd(85, 115) })),
      pasTraine: v(4, () => pas(ctx)),
      pasPresse: v(4, () => pas(ctx, { presse: true })),
      saisie: v(2, () => saisie(ctx)),
      coup: v(2, () => coup(ctx)),
      chute: [chute(ctx)],
      respiration: v(2, () => respiration(ctx)),
      oiseau: v(6, () => oiseau(ctx)),
      grillon: v(4, () => grillon(ctx)),
      vent: [ventBoucle(ctx, 12)],
      feu: [feuBoucle(ctx, 14)],
      briquet: [briquet(ctx)],
      allumage: [allumage(ctx)],
      buche: [buche(ctx), buche(ctx)],
      extinction: [extinction(ctx)]
    };
  }

  window.WattEteints = { preparer };
})();
