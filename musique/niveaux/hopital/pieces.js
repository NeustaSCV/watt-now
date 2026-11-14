/* Watt Now? — kit de niveau « Hôpital » : « le cœur de la machine » (musique/niveaux/PROPOSITION.md, validé le 2026-10-09).
   Tonique SI♭. 84 BPM, c'est un pouls : la musique bat comme un cœur, et le bip du moniteur (matière) le suit.
   Accords en QUARTES empilées, sans tierce : stérile, ni majeur ni mineur. La tierce n'arrive qu'en profondeur,
   en si♭ mineur harmonique (le la♮). Propre, froid, blanc ; presque pas de grave.
   Base NEUTRE : onde douce, verre, violons très aigus, glockenspiel lointain, un pouls sourd.
   MATIÈRE (remplaçable) : bip du moniteur, néons au si♭, ventilation, chariot, portes battantes, perfusion.
   Profondeur : dehors (hall d'accueil : Exploration) → dedans (couloirs, chambres) → profond (bloc opératoire, pharmacie). */
(function () {
  'use strict';
  const K = window.WattKits, L = window.WattMusique.lib, rnd = L.rnd, E = K.E, P = K.P, S = () => window.WattHopitalSons;
  const { TEMPS, BAR, BLOC, DUREE, X } = K;

  /* Le pouls : deux battements sourds (« lub-dub »), sans hauteur nette */
  function pouls(ctx, fort) {
    return L.sfxBuffer(ctx, 0.5, (d, sr) => [[0, 1], [0.17, 0.6]].forEach(([t0, a]) => {
      let ph = 0; const i0 = Math.floor(t0 * sr);
      for (let i = 0; i < 0.22 * sr && i0 + i < d.length; i++) { const s = i / sr, f = 48 + 30 * Math.exp(-s / 0.03); ph += 2 * Math.PI * f / sr; d[i0 + i] += a * (fort ? 1 : 0.8) * Math.sin(ph) * Math.exp(-s / 0.07) * Math.min(1, s / 0.004); }
    }));
  }
  const nappe = (ctx, G, couche, t, m, dur, gain, pan) => L.ondeDouce(ctx, G, couche, t, m, dur, 1, { gain, attack: 2.5, release: 3, pan, send: 0.55, cutoff: 2200 });

  const S1 = [70, 75, 80, 85], S2 = [65, 70, 75, 80], S3 = [60, 65, 70, 75], S4 = [63, 68, 73, 78], S5 = [68, 73, 78];
  const EXPLO = [
    [[0, 4, 58, S1], [4, 4, 53, S2]],                          // si♭ mi♭ la♭ ré♭ · fa si♭ mi♭ la♭
    [[0, 4, 48, S3], [4, 4, 51, S4]],                          // do fa si♭ mi♭ · mi♭ la♭ ré♭ sol♭
    [[0, 4, 56, S5], [4, 4, 53, S2]],                          // la♭ ré♭ sol♭ · fa si♭ mi♭ la♭
    [[0, 4, 58, S1], [4, 4, 53, [65, 70, 75, 81]]]             // … et le la♮ (mineur harmonique) qui annonce le retour
  ];
  const GLOCK = { 1: [[2, 80], [3, 85], [6, 87], [18, 82], [19, 87], [22, 80]], 3: [[2, 87], [3, 82], [6, 85], [18, 80], [20, 81], [22, 82]] };

  const def = {
    id: 'hopital', nom: 'l\'hôpital', tonique: 'si♭',
    instruments: ['violons', 'glock', 'harpe', 'logDrum', 'cymbale'],
    modes: { fond: 'quartes sur si♭ ; profond : si♭ mineur harmonique (la♮)', explo: 'quartes empilées sur si♭, sans tierce', tension: 'pouls en 3 contre 4, quartes, la♮', danger: 'si♭, mi♭, la♮ ; le pouls qui s\'emballe' },
    mixFond: { rt: [3.6, 3, 1.6], predelay: 0.03, verbWet: 0.45, tone: 11000, trim: {} },
    fond: {
      dehors: (bi) => (ctx, G) => {
        (bi ? S2 : S1).forEach((m, i) => L.souffleAccorde(ctx, G, 'fond', 0.02 + i * 0.6, m + 12, DUREE - 3, 1, { couleur: 'verre', gain: 0.01, attack: 3, release: 3, pan: -0.45 + i * 0.3 }));
        nappe(ctx, G, 'fond', 0.02, 58, DUREE - 3, 0.012, 0);
      },
      dedans: (bi) => (ctx, G) => {
        [[1, bi ? 87 : 82, 4], [4, bi ? 80 : 85, 4]].forEach(([m, n, d], i) => L.souffleAccorde(ctx, G, 'fond', m * BAR, n, d * BAR, 1, { couleur: 'verre', gain: 0.016, attack: 3, release: 3, pan: i ? 0.4 : -0.4 }));
        nappe(ctx, G, 'fond', 0.02, 46, DUREE - 3, 0.02, 0);
      },
      profond: (bi) => (ctx, G) => {
        [[2, 81, 3], [5, 85, 3]].forEach(([m, n, d], i) => L.souffleAccorde(ctx, G, 'fond', (m + bi) * BAR * 0.8, n + (bi && !i ? 12 : 0), d * BAR, 1, { couleur: 'verre', gain: 0.006, attack: 4, release: 4, pan: i ? 0.3 : -0.3 }));   // la♮, ré♭ : la tierce, enfin
        nappe(ctx, G, 'fond', 0.02, 46, DUREE - 3, 0.012, 0);
      }
    },
    matiereFond: {
      dehors: (bi) => (ctx, G) => {
        S().ventilation(ctx, G, 'matiere', 0.02, DUREE - 1, 0.01, 0.2);
        S().neon(ctx, G, 'matiere', 0.02, DUREE - 1.5, 0.004, -0.3, false);
        L.jouerSfx(ctx, G, 'matiere', (bi ? 4.6 : 1.8) * BAR, S().chariot(ctx), { gain: 0.04, pan: bi ? 0.7 : -0.7, send: 0.6, lp: 5000 });
      },
      dedans: (bi) => (ctx, G) => {
        S().neon(ctx, G, 'matiere', 0.02, DUREE - 1.5, 0.008, 0.4, true);
        S().ventilation(ctx, G, 'matiere', 0.02, DUREE - 1, 0.01, -0.3);
        const b = S().bip(ctx, 82);
        for (let k = 0; k < BLOC * 4; k += 2) L.jouerSfx(ctx, G, 'matiere', 0.02 + k * TEMPS, b, { gain: 0.012, pan: -0.6, send: 0.6, lp: 3000 });   // un moniteur, loin, dans une chambre
        [1.2, 5.7].forEach((m) => L.goutte(ctx, G, 'matiere', (m + bi * 0.3) * BAR, { gain: 0.03, pan: 0.5 }));                             // la perfusion
      },
      profond: (bi) => (ctx, G) => {
        const b = S().bip(ctx, 82);
        const fin = bi ? 5 : BLOC;                                     // bloc 2 : le moniteur s'arrête… puis plus rien
        for (let k = 0; k < fin * 4; k++) L.jouerSfx(ctx, G, 'matiere', 0.02 + k * TEMPS, b, { gain: 0.035, pan: 0.2, send: 0.4 });
        S().ventilation(ctx, G, 'matiere', 0.02, DUREE - 1, 0.006, 0);
      }
    },
    explo: {
      stems: ['pulsation', 'harmonie', 'melodie', 'matiere'],
      mix: { rt: [3.4, 2.8, 1.5], predelay: 0.03, verbWet: 0.42, tone: 11000, trim: {} },
      bloc: (bi) => ({
        /* Le pouls, sur chaque temps (un temps sur deux au premier bloc) */
        pulsation: (ctx, G) => { const p = pouls(ctx, false); for (let k = 0; k < BLOC * 4; k++) { if (bi === 0 && k % 2) continue; L.jouerSfx(ctx, G, 'pulsation', 0.02 + k * TEMPS, p, { gain: k % 4 ? 0.07 : 0.1, send: 0.15, lp: 400 }); } },
        /* Les quartes à l'onde douce, leurs sons harmoniques en verre, les violons très haut */
        harmonie: (ctx, G) => K.accords(EXPLO[bi], (t0, n, r, v, j, nb) => {
          const d = n * BAR + (j === nb - 1 ? -1.5 : 0.8);
          nappe(ctx, G, 'harmonie', t0, r, d, 0.024, 0);
          v.forEach((m, i) => nappe(ctx, G, 'harmonie', t0 + i * 0.3, m, d, 0.018, -0.45 + i * 0.3));
          E(ctx, G, 'harmonie', 'violons', t0 + 0.6, v[v.length - 1] + 12, d - 0.6, 0.15, { gain: 0.6, attack: 3, release: 3, pan: 0.35, send: 0.6 });
        }),
        melodie: (ctx, G) => {
          if (GLOCK[bi]) GLOCK[bi].forEach(([b, m]) => E(ctx, G, 'melodie', 'glock', 0.02 + b * TEMPS, m, 2, 0.3, { gain: 0.7, send: 0.7, pan: 0.3 }));
          else K.accords(EXPLO[bi], (t0, n, r, v) => [0, 1, 2].forEach((k) => E(ctx, G, 'melodie', 'harpe', t0 + (1 + k * 0.5) * TEMPS, v[k] + 12, 2.5, 0.25, { gain: 0.5, send: 0.6, pan: -0.2 + k * 0.2 })));
        },
        /* MATIÈRE : le bip du moniteur suit le pouls ; la ventilation ; un chariot, une porte */
        matiere: (ctx, G) => {
          const b = S().bip(ctx, 82);
          for (let k = 0; k < BLOC * 4; k++) { if (bi === 0 && k % 2) continue; L.jouerSfx(ctx, G, 'matiere', 0.02 + k * TEMPS + 0.04, b, { gain: 0.02, pan: -0.4, send: 0.5, lp: 4000 }); }
          S().ventilation(ctx, G, 'matiere', 0.02, DUREE - 1, 0.012, 0.3);
          if (bi === 1) L.jouerSfx(ctx, G, 'matiere', 5.2 * BAR, S().chariot(ctx), { gain: 0.035, pan: 0.6, send: 0.6 });
          if (bi === 3) L.jouerSfx(ctx, G, 'matiere', 2.3 * BAR, S().porte(ctx), { gain: 0.08, pan: -0.5, send: 0.5 });
        }
      })
    },
    tension: {
      mix: { rt: [3, 2.4, 1.3], predelay: 0.02, verbWet: 0.38, tone: 9000, trim: {} },
      bloc: (bi) => ({
        /* Le pouls en 3 contre 4 qui se resserre : le cœur s'accélère */
        pulsation: (ctx, G) => {
          const p = pouls(ctx, true);
          for (let m = 0; m < BLOC; m++) { const n = bi === 0 ? (m < 4 ? 3 : m < 6 ? 4 : 6) : (m < 2 ? 4 : 6); for (let k = 0; k < n; k++) L.jouerSfx(ctx, G, 'pulsation', 0.02 + m * BAR + k * BAR / n, p, { gain: 0.13, send: 0.15, lp: 400 }); }
        },
        texture: (ctx, G) => {
          S2.forEach((m, i) => nappe(ctx, G, 'texture', 0.02 + i * 0.2, m, DUREE - 2, 0.03, -0.45 + i * 0.3));
          L.souffleAccorde(ctx, G, 'texture', 4 * BAR, 81, 4 * BAR - 1.5, 1, { couleur: 'verre', gain: 0.014, attack: 3, release: 3, pan: 0.4 });   // le la♮
          E(ctx, G, 'texture', 'violons', 2 * BAR, 87, 6 * BAR - 1.5, 0.12, { gain: 0.3, attack: 4, release: 2.5, pan: -0.3, send: 0.6 });
        },
        /* MATIÈRE : le moniteur s'accélère (croches), une porte qui claque au loin */
        matiere: (ctx, G) => {
          const b = S().bip(ctx, 82);
          for (let k = 0; k < BLOC * 8; k++) { if (k < 32 && k % 2 && bi === 0) continue; L.jouerSfx(ctx, G, 'matiere', 0.02 + k * X + 0.04, b, { gain: 0.03, pan: -0.3, send: 0.4 }); }
          L.jouerSfx(ctx, G, 'matiere', (bi ? 1.6 : 5.4) * BAR, S().porte(ctx), { gain: 0.07, pan: 0.6, send: 0.6 });
        }
      })
    },
    danger: {
      mix: { rt: [2.4, 2, 1.1], predelay: 0.01, verbWet: 0.3, tone: 10000, trim: {} },
      bloc: (bi) => ({
        percussions: (ctx, G) => {
          const p = pouls(ctx, true);
          for (let pp = 0; pp < BLOC / 2; pp++) {
            const t0 = 0.02 + pp * 2 * BAR;
            [0, 3, 6, 9, 12, 14].forEach((c, k) => L.jouerSfx(ctx, G, 'percussions', t0 + c * X, p, { gain: k ? 0.15 : 0.2, send: 0.15, lp: 500 }));
            [2, 8].forEach((c) => P(ctx, G, 'percussions', t0 + c * X, /slitdrum1_mp/, 0.8, { pan: c > 4 ? 0.3 : -0.3, send: 0.25 }));
          }
          [0, 4].forEach((m) => P(ctx, G, 'percussions', 0.02 + m * BAR, /susp_hit_softmall_roll2/, 0.4, { send: 0.4 }));
        },
        basse: (ctx, G) => {
          for (let pp = 0; pp < BLOC / 2; pp++) [[0, 46], [3, 46], [6, 51], [9, 46], [12, bi && pp >= 2 ? 47 : 45], [14, 46]].forEach(([c, n], k) => L.ondeDouce(ctx, G, 'basse', 0.02 + pp * 2 * BAR + c * X, n, X * (k < 4 ? 2.4 : 1.4), 1, { gain: 0.1, attack: 0.008, release: 0.15, cutoff: 900, send: 0.1 }));
        },
        stridences: (ctx, G) => {
          [1, 3, 5, 7].forEach((m, k) => E(ctx, G, 'stridences', 'violons', 0.02 + (m + rnd(0, 0.4)) * BAR, [86, 87, 85, 88][k], 1.4 * BAR, 0.2, { gain: 0.4, attack: 0.6, release: 1, pan: rnd(-0.5, 0.5), send: 0.5 }));
          L.vent(ctx, G, 'stridences', 0.02, DUREE - 0.5, 1, { gain: 0.025, center: 3000 });
        },
        nombre: (ctx, G) => {
          const p = pouls(ctx, true);
          for (let pp = 0; pp < BLOC / 2; pp++) { const t0 = 0.02 + pp * 2 * BAR; [1, 4, 7, 10, 13, 15].forEach((c) => L.jouerSfx(ctx, G, 'nombre', t0 + c * X, p, { gain: 0.08, send: 0.1, lp: 500 })); [5, 11].forEach((c) => P(ctx, G, 'nombre', t0 + c * X, /slitdrum2_mp/, 0.6, { pan: rnd(-0.5, 0.5) })); }
        },
        /* MATIÈRE : le moniteur s'emballe (rythme irrégulier, plus aigu), les néons claquent */
        matiere: (ctx, G) => {
          const b = S().bip(ctx, 85, 0.08);
          for (let t = 0.02; t < DUREE - 0.3; t += rnd(0.12, 0.42)) L.jouerSfx(ctx, G, 'matiere', t, b, { gain: 0.025, pan: rnd(-0.4, 0.4), send: 0.3 });
          [1.5, 4.2, 6.6].forEach((m) => L.neon(ctx, G, 'matiere', (m + bi * 0.4) * BAR, { gain: 0.02 }));
        }
      })
    },
    signaux: {
      arriveeHopital: [8, (ctx, G) => {
        L.jouerSfx(ctx, G, 'matiere', 0.1, S().porte(ctx), { gain: 0.3, send: 0.5 });
        S1.forEach((m, i) => E(ctx, G, 'melodie', 'glock', 1.2 + i * 0.35, m + 12, 2.5, 0.3, { gain: 0.5, send: 0.7, pan: -0.3 + i * 0.2 }));
        S1.forEach((m, i) => L.ondeDouce(ctx, G, 'harmonie', 1.2, m, 4, 1, { gain: 0.012, attack: 1, release: 2.5, pan: -0.3 + i * 0.2 }));
      }],
      butinHopital: [6, (ctx, G) => {
        [70, 75, 80, 85, 82].forEach((m, i) => E(ctx, G, 'melodie', 'glock', 0.05 + i * 0.18, m + 12, 2, 0.4 - i * 0.03, { gain: 0.6, send: 0.6, pan: -0.3 + i * 0.15 }));
        L.souffleAccorde(ctx, G, 'harmonie', 0.3, 70, 2.5, 1, { couleur: 'verre', gain: 0.02, attack: 0.8, release: 2.5 });
      }],
      sortieHopital: [8, (ctx, G) => {
        [S2, S1].forEach((acc, j) => acc.forEach((m, i) => L.ondeDouce(ctx, G, 'harmonie', 0.1 + j * 2.6 + i * 0.1, m, j ? 3 : 2.3, 1, { gain: 0.02, attack: 0.8, release: j ? 3.5 : 1.2, pan: -0.3 + i * 0.2 })));
      }]
    },
    /* L'appel d'infirmière qui sonne dans le vide : fa – si♭, toutes les 8 s, avec le ronflement d'un néon (16 s, en boucle) */
    diegetique: ['appel-hopital', async (sr) => K.rendreBoucle(sr, 16, { couches: ['matiere'], rt: [1.6, 1.3, 0.8], predelay: 0.02, verbWet: 0.3, tone: 12000, trim: {} }, (ctx, G, t) => {
      [0, 8].forEach((x) => L.jouerSfx(ctx, G, 'matiere', t + x, S().appel(ctx), { gain: 0.6, send: 0.4 }));
      S().neon(ctx, G, 'matiere', t, 16.5, 0.012, 0, false);
    }), { boucle: true }]
  };

  window.WattKitHopital = { def, preparer: (sr, progres) => K.preparerKit(def, sr, progres), instruments: def.instruments, BAR, DUREE_BLOC: DUREE };
})();
