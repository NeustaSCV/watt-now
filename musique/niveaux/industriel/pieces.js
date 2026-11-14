/* Watt Now? — kit de niveau « Industriel » : « la machine qui joue seule » (musique/niveaux/PROPOSITION.md, validé le 2026-10-09).
   Tonique SI : la suite de ré → la → mi → si, le plus loin de la maison. Si mineur mélodique (la♯, sol♯) : sombre et moderne.
   Le rythme d'abord (Amon Tobin) : trois périodes, 3, 4 et 5 croches, qui ne retombent ensemble qu'une fois par bloc.
   Base NEUTRE : percussions de bois et de fer d'orchestre, trombones graves, basse saturée sobre, souffle métallique, violoncelles.
   MATIÈRE (remplaçable) : pistons sur la période 3, chaîne du convoyeur sur la 4, marteau-pilon sur la 5 ; vapeur, transformateurs, sirène.
   Profondeur : dehors (parking, quais : Exploration) → dedans (ateliers) → profond (salle des machines). */
(function () {
  'use strict';
  const K = window.WattKits, L = window.WattMusique.lib, rnd = L.rnd, mtof = L.mtof, E = K.E, P = K.P, S = () => window.WattIndustrielSons;
  const { TEMPS, BAR, BLOC, DUREE, X } = K;
  const CROCHES = BLOC * 8;                                           // 64 croches par bloc
  /* Les instants (en croches) d'une période : 0, p, 2p… */
  const periode = (p, debut) => { const r = []; for (let c = debut || 0; c < CROCHES; c += p) r.push(c); return r; };

  function basseSaturee(ctx, G, couche, t, midi, dur, vel) {
    const amp = L.voiceOut(ctx, G, couche, 0, 0.05);
    const ws = ctx.createWaveShaper(), cv = new Float32Array(1024); for (let i = 0; i < 1024; i++) cv[i] = Math.tanh(3 * (i / 511.5 - 1)); ws.curve = cv;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 1;
    const a = ctx.createOscillator(); a.type = 'sawtooth'; a.frequency.value = mtof(midi);
    const b = ctx.createOscillator(); b.type = 'square'; b.frequency.value = mtof(midi) / 2; const bg = ctx.createGain(); bg.gain.value = 0.4;
    a.connect(ws); b.connect(bg); bg.connect(ws); ws.connect(lp); lp.connect(amp);
    amp.gain.setValueAtTime(0, t); amp.gain.linearRampToValueAtTime(0.08 * vel, t + 0.01); amp.gain.setTargetAtTime(0.045 * vel, t + 0.02, 0.1); amp.gain.setTargetAtTime(0, t + dur, 0.05);
    [a, b].forEach((o) => { o.start(t); o.stop(t + dur + 0.4); });
  }
  const metal = (ctx, G, couche, t, m, dur, gain, pan) => L.souffleAccorde(ctx, G, couche, t, m, dur, 1, { couleur: 'metal', gain, attack: 2.5, release: 3, pan, send: 0.55 });

  /* Si mineur mélodique */
  const EXPLO = [
    [[0, 4, 35, [50, 54, 58, 62]], [4, 4, 40, [56, 59, 62, 66]]],                          // si m(maj7) · mi 9
    [[0, 4, 44, [56, 59, 62, 66]], [4, 4, 42, [54, 58, 61, 64]]],                          // sol♯ m7♭5 · fa♯ 7
    [[0, 4, 38, [50, 54, 58, 61]], [4, 4, 40, [56, 59, 62, 66]]],                          // ré maj7♯5 (le III augmenté du mineur mélodique) · mi 9
    [[0, 4, 35, [50, 54, 58, 62]], [4, 4, 42, [54, 58, 61, 64]]]                           // si m(maj7) · fa♯ 7
  ];

  const def = {
    id: 'industriel', nom: 'l\'industriel', tonique: 'si',
    instruments: ['trombone', 'violoncelles', 'logDrum', 'metalDivers', 'gong', 'cymbale', 'harpe'],
    modes: { fond: 'bourdon si-fa♯ ; dedans : la♯ et sol♯ dans l\'aigu', explo: 'si mineur mélodique ; polyrythmie 3, 4, 5 croches', tension: 'pulsation 3 contre 4, si-fa♯, la♯', danger: 'si, ré, la♯ ; toutes les machines à la fois' },
    mixFond: { rt: [4.5, 3.6, 1.6], predelay: 0.04, verbWet: 0.5, tone: 9000, trim: {} },
    fond: {
      dehors: (bi) => (ctx, G) => { metal(ctx, G, 'fond', 0.02, 47, DUREE - 2, 0.03, -0.2); metal(ctx, G, 'fond', 1.5, 54, DUREE - 4, 0.016, 0.3); if (bi) L.souffleAccorde(ctx, G, 'fond', 4 * BAR, 82, 3 * BAR, 1, { couleur: 'verre', gain: 0.005, attack: 3, release: 3, pan: 0.5 }); },
      dedans: (bi) => (ctx, G) => {
        L.sousBasse(ctx, G, 'fond', 0.02, 47, DUREE - 2, 1, { gain: 0.03, attack: 3, release: 3 });
        [[1, bi ? 80 : 82, 4], [4, bi ? 85 : 78, 4]].forEach(([m, n, d], i) => L.souffleAccorde(ctx, G, 'fond', m * BAR, n, d * BAR, 1, { couleur: 'metal', gain: 0.006, attack: 3, release: 3, pan: i ? 0.4 : -0.4 }));   // la♯, sol♯ · fa♯, do♯
      },
      profond: (bi) => (ctx, G) => { L.sousBasse(ctx, G, 'fond', 0.02, 47, DUREE - 2, 1, { gain: 0.016, attack: 5, release: 4 }); L.souffleAccorde(ctx, G, 'fond', (bi ? 4 : 2) * BAR, bi ? 94 : 90, 3 * BAR, 1, { couleur: 'verre', gain: 0.003, attack: 5, release: 4, pan: bi ? -0.3 : 0.3 }); }
    },
    matiereFond: {
      dehors: (bi) => (ctx, G) => {
        L.vent(ctx, G, 'matiere', 0.02, DUREE - 0.5, 1, { gain: 0.035, center: 500 });
        S().ronflement(ctx, G, 'matiere', 0.02, DUREE - 1, 0.008, 0.5);
        if (bi) S().sirene(ctx, G, 'matiere', 3 * BAR, 6, 0.008, -0.7); else L.jouerSfx(ctx, G, 'matiere', 5.2 * BAR, S().tole(ctx), { gain: 0.05, pan: 0.7, send: 1, lp: 1500 });
      },
      dedans: (bi) => (ctx, G) => {
        const m = S().maillons(ctx);
        periode(4).forEach((c) => L.jouerSfx(ctx, G, 'matiere', 0.02 + c * X, m, { gain: 0.03, pan: -0.5, send: 0.6, lp: 2500 }));   // le convoyeur, loin
        L.jouerSfx(ctx, G, 'matiere', (bi ? 2.5 : 5.5) * BAR, S().vapeur(ctx, 3), { gain: 0.03, pan: 0.5, send: 0.5, hp: 2000 });
        S().ronflement(ctx, G, 'matiere', 0.02, DUREE - 1, 0.006, 0);
      },
      profond: (bi) => (ctx, G) => {
        const p = S().piston(ctx, 1);                                   // une seule machine ; au bloc 2 elle ralentit et s'arrête, puis le souffle
        (bi ? periode(6).filter((c) => c < 40) : periode(3)).forEach((c) => L.jouerSfx(ctx, G, 'matiere', 0.02 + c * X, p, { gain: 0.06, pan: 0.2, send: 0.4 }));
        if (bi) L.jouerSfx(ctx, G, 'matiere', 5.2 * BAR, S().vapeur(ctx, 4), { gain: 0.03, send: 0.6, hp: 1200 });
      }
    },
    explo: {
      stems: ['rythmique', 'basse', 'harmonie', 'matiere'],
      mix: { rt: [3.2, 2.6, 1.4], predelay: 0.025, verbWet: 0.38, tone: 10000, trim: {} },
      bloc: (bi) => ({
        /* Trois périodes : le tambour de bois sur 4, le tambour de frein (fer) sur 3, le gong étouffé sur 5 */
        rythmique: (ctx, G) => {
          periode(4).forEach((c, k) => P(ctx, G, 'rythmique', 0.02 + c * X, k % 4 ? /slitdrum1_ppp/ : /slitdrum0_mp/, k % 4 ? 0.9 : 1.1, { send: 0.3, pan: -0.25 }));
          if (bi >= 1) periode(3).forEach((c) => P(ctx, G, 'rythmique', 0.02 + c * X, /brake_mf/, 0.18, { send: 0.25, pan: 0.35 }));
          if (bi >= 2) periode(5).forEach((c) => P(ctx, G, 'rythmique', 0.02 + c * X, /gong_smack_low/, 0.22, { send: 0.4, pan: 0.05 }));
        },
        /* Trombones tenus sur la fondamentale ; la basse saturée, sobre, sur la période 4 */
        basse: (ctx, G) => K.accords(EXPLO[bi], (t0, n, r) => {
          E(ctx, G, 'basse', 'trombone', t0 + 0.1, r + 12, n * BAR - 0.6, 0.3, { gain: 0.45, attack: 1.2, release: 2, send: 0.3, lp: 1100 });
          for (let c = 0; c < n * 8; c += 4) basseSaturee(ctx, G, 'basse', t0 + c * X, r, X * 1.6, c % 8 ? 0.6 : 0.85);
        }),
        /* Le souffle métallique et les violoncelles : l'accord, lent */
        harmonie: (ctx, G) => K.accords(EXPLO[bi], (t0, n, r, v, j, nb) => {
          const d = n * BAR + (j === nb - 1 ? -1.5 : 0.8);
          v.forEach((m, i) => metal(ctx, G, 'harmonie', t0 + i * 0.3, m, d, 0.03, -0.45 + i * 0.3));
          E(ctx, G, 'harmonie', 'violoncelles', t0 + 0.4, v[0], d - 0.4, 0.25, { gain: 0.9, attack: 2.2, release: 2.5, send: 0.5, pan: -0.2 });
          if (bi % 2) E(ctx, G, 'harmonie', 'harpe', t0 + 2 * TEMPS, v[3] + 12, 2.5, 0.3, { gain: 0.5, send: 0.6, pan: 0.4 });
        }),
        /* MATIÈRE : les machines, calées sur les trois périodes ; le ronflement des transformateurs */
        matiere: (ctx, G) => {
          const pi = S().piston(ctx, 0.8), ma = S().maillons(ctx);
          periode(4).forEach((c) => L.jouerSfx(ctx, G, 'matiere', 0.02 + c * X, ma, { gain: 0.025, pan: -0.4, send: 0.4 }));
          if (bi >= 1) periode(3).forEach((c) => L.jouerSfx(ctx, G, 'matiere', 0.02 + c * X, pi, { gain: 0.035, pan: 0.4, send: 0.35 }));
          if (bi >= 2) periode(5).filter((c, k) => k % 2 === 0).forEach((c) => L.jouerSfx(ctx, G, 'matiere', 0.02 + c * X, S().marteau(ctx), { gain: 0.03, send: 0.5, pan: 0.1 }));
          S().ronflement(ctx, G, 'matiere', 0.02, DUREE - 1, 0.006, 0.3);
          if (bi === 1) S().sirene(ctx, G, 'matiere', 5 * BAR, 6, 0.006, -0.7);
        }
      })
    },
    tension: {
      mix: { rt: [3, 2.4, 1.3], predelay: 0.02, verbWet: 0.38, tone: 8500, trim: {} },
      bloc: (bi) => ({
        pulsation: (ctx, G) => {
          for (let m = 0; m < BLOC; m++) { const n = bi === 0 ? (m < 4 ? 3 : m < 6 ? 4 : 6) : (m < 2 ? 4 : 6); for (let k = 0; k < n; k++) P(ctx, G, 'pulsation', 0.02 + m * BAR + k * BAR / n, k ? /slitdrum1_ppp/ : /slitdrum0_mp/, k ? 0.6 : 0.8, { send: 0.3, lp: 1500 }); }
          for (let m = 0; m < BLOC; m += 2) basseSaturee(ctx, G, 'pulsation', 0.02 + m * BAR, 35, 0.4, 0.45);
        },
        texture: (ctx, G) => { metal(ctx, G, 'texture', 0.02, 47, DUREE - 2, 0.05, -0.2); metal(ctx, G, 'texture', 0.5, 54, DUREE - 2.5, 0.03, 0.2); metal(ctx, G, 'texture', 4 * BAR, bi ? 70 : 71, 4 * BAR - 1.5, 0.012, 0.4); },   // la♯ puis si, en haut
        matiere: (ctx, G) => {
          const pi = S().piston(ctx, 0.8);
          for (let m = 0; m < BLOC; m++) { const n = m < 4 ? 2 : m < 6 ? 3 : 4; for (let k = 0; k < n; k++) L.jouerSfx(ctx, G, 'matiere', 0.02 + m * BAR + k * BAR / n + X / 2, pi, { gain: 0.035, pan: 0.4, send: 0.35 }); }   // les pistons s'accélèrent
          L.jouerSfx(ctx, G, 'matiere', (bi ? 2 : 6) * BAR, S().vapeur(ctx, 2.5), { gain: 0.03, pan: -0.5, send: 0.5, hp: 1800 });
        }
      })
    },
    danger: {
      mix: { rt: [2.4, 2, 1.1], predelay: 0.01, verbWet: 0.3, tone: 10000, trim: {} },
      bloc: (bi) => ({
        /* Toutes les périodes à la fois, plus fort */
        percussions: (ctx, G) => {
          periode(4).forEach((c, k) => P(ctx, G, 'percussions', 0.02 + c * X, k % 2 ? /slitdrum1_ff/ : /slitdrum0_ff/, 0.6, { send: 0.25, pan: -0.25 }));
          periode(3).forEach((c) => P(ctx, G, 'percussions', 0.02 + c * X, /brake_mf/, 0.4, { send: 0.2, pan: 0.35 }));
          periode(5).forEach((c) => P(ctx, G, 'percussions', 0.02 + c * X, /gong_smack_low/, 0.28, { send: 0.3 }));
        },
        basse: (ctx, G) => { for (let p = 0; p < BLOC / 2; p++) [[0, 35], [3, 35], [6, 38], [9, 35], [12, bi && p >= 2 ? 36 : 34], [14, 35]].forEach(([c, n], k) => basseSaturee(ctx, G, 'basse', 0.02 + p * 2 * BAR + c * X, n, X * (k < 4 ? 2.6 : 1.6), k ? 0.8 : 1)); },
        stridences: (ctx, G) => { [1, 3, 5, 7].forEach((m) => L.grincementMetal(ctx, G, 'stridences', 0.02 + (m + rnd(0.1, 0.6)) * BAR, { gain: 0.06 })); L.vent(ctx, G, 'stridences', 0.02, DUREE - 0.5, 1, { gain: 0.035, center: 2400 }); },
        nombre: (ctx, G) => {
          periode(2, 1).forEach((c) => P(ctx, G, 'nombre', 0.02 + c * X, /slitdrum2_mp/, 0.7, { send: 0.2, pan: rnd(-0.6, 0.6) }));
          [0, 4].forEach((m) => P(ctx, G, 'nombre', 0.02 + m * BAR, /brake_fff/, 0.4, { send: 0.3 }));
        },
        /* MATIÈRE : toutes les machines repartent en même temps, le marteau-pilon, la vapeur, la tôle */
        matiere: (ctx, G) => {
          const pi = S().piston(ctx, 1), ma = S().maillons(ctx), mt = S().marteau(ctx);
          periode(3).forEach((c) => L.jouerSfx(ctx, G, 'matiere', 0.02 + c * X, pi, { gain: 0.04, pan: 0.4, send: 0.3 }));
          periode(4).forEach((c) => L.jouerSfx(ctx, G, 'matiere', 0.02 + c * X, ma, { gain: 0.03, pan: -0.4, send: 0.3 }));
          periode(10).forEach((c) => L.jouerSfx(ctx, G, 'matiere', 0.02 + c * X, mt, { gain: 0.06, send: 0.4 }));
          [1.5, 5.5].forEach((m) => L.jouerSfx(ctx, G, 'matiere', (m + bi * 0.5) * BAR, S().vapeur(ctx, 2), { gain: 0.04, send: 0.4, hp: 1500 }));
        }
      })
    },
    signaux: {
      arriveeIndustriel: [8, (ctx, G) => {
        S().sirene(ctx, G, 'matiere', 0.1, 4, 0.02, -0.4);
        [35, 50, 54, 58].forEach((m, i) => (i ? metal(ctx, G, 'harmonie', 1.4 + i * 0.25, m, 3.5, 0.03, -0.3 + i * 0.2) : E(ctx, G, 'basse', 'trombone', 1.4, m + 12, 3.5, 0.4, { gain: 0.5, attack: 0.8, release: 2 })));
      }],
      butinIndustriel: [6, (ctx, G) => {
        [[59, 0], [62, 0.18], [66, 0.36], [70, 0.54], [71, 0.9]].forEach(([m, d], i) => E(ctx, G, 'melodie', 'harpe', 0.05 + d, m + 12, 3, 0.5 - i * 0.04, { gain: 0.9, send: 0.6, pan: -0.3 + i * 0.15 }));   // si ré fa♯ la♯ si
        L.jouerSfx(ctx, G, 'matiere', 1, S().maillons(ctx), { gain: 0.1, pan: 0.5, send: 0.6 });
      }],
      sortieIndustriel: [8, (ctx, G) => {
        [[42, 54, 58, 61, 64], [35, 50, 54, 58, 62]].forEach((acc, j) => acc.forEach((m, i) => (i ? metal(ctx, G, 'harmonie', 0.1 + j * 2.6 + i * 0.1, m, j ? 3 : 2.3, 0.04, -0.3 + i * 0.2) : E(ctx, G, 'basse', 'trombone', 0.1 + j * 2.6, m + 12, j ? 3 : 2.3, 0.35, { gain: 0.5, attack: 0.5, release: 2 }))));
      }]
    },
    /* La sirène de fin de poste : deux montées et descentes, ≈ 12 s, une fois (un leurre très puissant) */
    diegetique: ['sirene-industriel', async (sr) => K.rendreUneFois(sr, 13, { couches: ['matiere'], rt: [3, 2.4, 1.3], predelay: 0.04, verbWet: 0.35, tone: 10000, trim: {} }, (ctx, G) => {
      [0.1, 6].forEach((t) => S().sirene(ctx, G, 'matiere', t, 5.5, 0.12, 0));
    }, 1), { boucle: false }]
  };

  window.WattKitIndustriel = { def, preparer: (sr, progres) => K.preparerKit(def, sr, progres), instruments: def.instruments, BAR, DUREE_BLOC: DUREE };
})();
