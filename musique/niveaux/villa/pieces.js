/* Watt Now? — kit de niveau « Villa » : « le luxe qui tourne à vide » (musique/niveaux/PROPOSITION.md, validé le 2026-10-09).
   Tonique FA. Fa dorien en accords de neuvième, façon lounge et bossa des années 70 (Khruangbin) ; dedans, il glisse vers
   fa mineur mélodique (le mi♮). Beau et absurde (Book 15) : la domotique attend encore Monsieur.
   Base NEUTRE : piano électrique (onde douce), basse ronde feutrée, claves et balais, flûte, harpe.
   MATIÈRE (remplaçable) : piscine, fontaine, cristal, carillon de la porte, volets électriques.
   Profondeur : dehors (jardin, piscine : Exploration) → dedans (salons) → profond (cave, bunker en panne). */
(function () {
  'use strict';
  const K = window.WattKits, L = window.WattMusique.lib, rnd = L.rnd, mtof = L.mtof, E = K.E, P = K.P, S = () => window.WattVillaSons;
  const { TEMPS, BAR, BLOC, DUREE, X } = K;

  /* Basse ronde feutrée (triangle + sinus, filtre fermé) */
  function basse(ctx, G, couche, t, midi, dur, vel, sature) {
    const f = mtof(midi), amp = L.voiceOut(ctx, G, couche, 0, 0.08);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = sature ? 700 : 480; lp.Q.value = 0.8; lp.connect(amp);
    let entree = lp;
    if (sature) { const ws = ctx.createWaveShaper(), cv = new Float32Array(1024); for (let i = 0; i < 1024; i++) cv[i] = Math.tanh(3.5 * (i / 511.5 - 1)); ws.curve = cv; ws.connect(lp); entree = ws; }
    const a = ctx.createOscillator(); a.type = sature ? 'sawtooth' : 'triangle'; a.frequency.value = f;
    const b = ctx.createOscillator(); b.frequency.value = f; const bg = ctx.createGain(); bg.gain.value = 0.8; b.connect(bg); bg.connect(entree); a.connect(entree);
    amp.gain.setValueAtTime(0, t); amp.gain.linearRampToValueAtTime(0.09 * vel, t + 0.008); amp.gain.setTargetAtTime(0.055 * vel, t + 0.01, 0.18);
    amp.gain.setValueAtTime(0.055 * vel, t + dur); amp.gain.linearRampToValueAtTime(0, t + dur + 0.08);
    [a, b].forEach((o) => { o.start(t); o.stop(t + dur + 0.12); });
  }
  /* Balai sur caisse claire : un frottement court, ou une frappe (accent) */
  function balai(ctx, frappe) {
    return L.sfxBuffer(ctx, frappe ? 0.35 : 0.22, (d, sr) => {
      let lp = 0, hp = 0, prev = 0;
      for (let i = 0; i < d.length; i++) {
        const s = i / sr, env = frappe ? Math.exp(-s / 0.08) : Math.sin(Math.PI * Math.min(1, s / 0.2)) * 0.6;
        const n = Math.random() * 2 - 1; hp = 0.85 * (hp + n - prev); prev = n; lp += 0.5 * (hp - lp);
        d[i] = lp * env + (frappe ? 0.3 * Math.sin(2 * Math.PI * 190 * s) * Math.exp(-s / 0.04) : 0);
      }
    });
  }
  /* Piano électrique : l'onde douce des Voltaïques, en accord tenu (nappe) ou en coup court (comp) */
  const ep = (ctx, G, couche, t, m, dur, gain, pan, court) => L.ondeDouce(ctx, G, couche, t, m, dur, 1, { gain, attack: court ? 0.006 : 1.5, release: court ? 0.35 : 2.2, pan, send: 0.35, cutoff: court ? 2600 : 1600 });

  /* [mesure, nombre de mesures, fondamentale, voix] — fa dorien en neuvièmes */
  const EXPLO = [
    [[0, 4, 41, [56, 60, 63, 67]], [4, 4, 46, [56, 60, 62, 65]]],          // fa m9 · si♭ 9 (le ré♮ du dorien)
    [[0, 4, 39, [55, 58, 62, 65]], [4, 4, 44, [55, 60, 63, 67]]],          // mi♭ maj9 · la♭ maj7
    [[0, 4, 37, [53, 56, 60, 63]], [4, 2, 36, [53, 55, 58, 62]], [6, 2, 36, [52, 55, 58, 62]]],   // ré♭ maj9 · do 7sus4 → do 9 (le mi♮)
    [[0, 4, 41, [56, 60, 63, 67]], [4, 4, 46, [56, 62, 67, 69]]]           // fa m9 · si♭ 13
  ];
  const CLAVE = [0, 3, 6, 10, 12];                         // la clave de bossa, sur 16 croches (2 mesures)
  const RIFF = [[0, 0, 3], [3, 7, 1], [4, 7, 3], [7, 0, 1]];   // [croche, intervalle, durée] sur une mesure
  /* La flûte : deux phrases de lounge (blocs 2 et 4) [temps, note, durée] */
  const FLUTE = {
    1: [[2, 67, 1.5], [3.5, 70, 0.5], [4, 72, 3], [8, 70, 1], [9, 67, 1], [10, 65, 4], [18, 63, 1.5], [19.5, 65, 0.5], [20, 67, 2], [22, 62, 6]],
    3: [[2, 72, 1], [3, 75, 1], [4, 74, 2], [6, 72, 2], [8, 68, 4], [18, 67, 1], [19, 68, 1], [20, 70, 2], [22, 69, 2], [24, 65, 6]]
  };

  const def = {
    id: 'villa', nom: 'la villa', tonique: 'fa',
    instruments: ['flute', 'harpe', 'boisDivers', 'cymbale', 'logDrum', 'metalDivers'],
    modes: { fond: 'bourdon fa-do ; dedans : fa mineur mélodique (mi♮)', explo: 'fa dorien, accords de neuvième (lounge, bossa)', tension: 'pulsation 3 contre 4, fa-do, mi♮ dans l\'aigu', danger: 'fa, la♭, mi♮ ; le groove qui se casse' },
    mixFond: { rt: [3, 2.4, 1.2], predelay: 0.02, verbWet: 0.4, tone: 9500, trim: {} },
    fond: {
      dehors: (bi) => (ctx, G) => {
        [[53, 0], [60, 0.8], [63, 1.6]].forEach(([m, d], i) => ep(ctx, G, 'fond', 0.02 + d, m, DUREE - 3, 0.012, -0.3 + i * 0.3));
        L.sousBasse(ctx, G, 'fond', 0.02, 41, DUREE - 2, 1, { gain: 0.03, attack: 3, release: 3 });
        if (bi) L.souffleAccorde(ctx, G, 'fond', 4 * BAR, 79, 3 * BAR, 1, { couleur: 'verre', gain: 0.006, attack: 3, release: 3, pan: 0.5 });   // sol, la neuvième
      },
      dedans: (bi) => (ctx, G) => {
        L.sousBasse(ctx, G, 'fond', 0.02, 41, DUREE - 2, 1, { gain: 0.03, attack: 3, release: 3 });
        [[1, 77, 4], [4, bi ? 76 : 80, 4]].forEach(([m, n, d], i) => L.souffleAccorde(ctx, G, 'fond', m * BAR, n, d * BAR, 1, { couleur: 'verre', gain: 0.008, attack: 3, release: 3, pan: i ? 0.4 : -0.4 }));   // fa · la♭ ou mi♮ (mineur mélodique)
        ep(ctx, G, 'fond', 0.5, 84, DUREE - 3, 0.006, 0.2);
      },
      profond: (bi) => (ctx, G) => {
        L.sousBasse(ctx, G, 'fond', 0.02, 41, DUREE - 2, 1, { gain: 0.014, attack: 5, release: 4 });
        L.souffleAccorde(ctx, G, 'fond', (bi ? 4 : 2) * BAR, bi ? 88 : 89, 3 * BAR, 1, { couleur: 'verre', gain: 0.003, attack: 5, release: 4, pan: bi ? -0.3 : 0.3 });   // mi♮, fa : tout en haut
      }
    },
    matiereFond: {
      dehors: (bi) => (ctx, G) => {
        S().piscine(ctx, G, 'matiere', 0.02, DUREE - 1, 0.03, -0.3);
        L.feuillage(ctx, G, 'matiere', 0.02, DUREE - 1, 1, { gain: 0.012, pan: 0.5 });
        if (bi) L.oiseau(ctx, G, 'matiere', 3.2 * BAR, { gain: 0.012, pan: 0.7 });
      },
      dedans: (bi) => (ctx, G) => {
        S().fontaine(ctx, G, 'matiere', 0.02, DUREE - 1, 0.012, -0.5);
        L.courant(ctx, G, 'matiere', 0.02, DUREE - 1, 1, { gain: 0.006 });                                  // le frigo américain, la climatisation
        L.verreTinte(ctx, G, 'matiere', (bi ? 5.3 : 2.1) * BAR, { gain: 0.03, pan: 0.5 });
      },
      profond: (bi) => (ctx, G) => {
        L.courant(ctx, G, 'matiere', 0.02, DUREE - 1, 1, { gain: 0.012 });
        L.relais(ctx, G, 'matiere', (bi ? 2.4 : 6.1) * BAR, { gain: 0.05, pan: -0.4 });                     // le bunker de luxe en panne
        L.goutte(ctx, G, 'matiere', (bi ? 5.5 : 1.3) * BAR, { gain: 0.04, pan: 0.6 });
      }
    },
    explo: {
      stems: ['rythmique', 'basse', 'harmonie', 'melodie', 'matiere'],
      mix: { rt: [2.6, 2, 1.1], predelay: 0.02, verbWet: 0.32, tone: 10000, trim: {} },
      bloc: (bi) => ({
        /* Claves en clave de bossa, balais en croches, frappe sur 2 et 4 */
        rythmique: (ctx, G) => {
          const sw = balai(ctx, false), fr = balai(ctx, true);
          for (let p = 0; p < BLOC / 2; p++) {
            const t0 = 0.02 + p * 2 * BAR;
            CLAVE.forEach((c) => P(ctx, G, 'rythmique', t0 + c * X, /claves_mf/, bi === 0 ? 0.4 : 0.6, { pan: 0.35, send: 0.25 }));
            for (let c = 0; c < 16; c++) L.jouerSfx(ctx, G, 'rythmique', t0 + c * X, c % 4 === 2 ? fr : sw, { gain: c % 4 === 2 ? 0.11 : 0.05, pan: -0.25, send: 0.15 });
          }
        },
        basse: (ctx, G) => K.accords(EXPLO[bi], (t0, n, r) => { for (let m = 0; m < n; m++) RIFF.forEach(([c, iv, du]) => basse(ctx, G, 'basse', t0 + m * BAR + c * X, r + iv - (iv ? 12 : 0) + 12, du * X * 0.9, c ? 0.38 : 0.5)); }),
        /* Piano électrique : la nappe de l'accord et le comp de bossa (croches 3 et 6, puis 2 et 5) */
        harmonie: (ctx, G) => K.accords(EXPLO[bi], (t0, n, r, v) => {
          v.forEach((m, i) => ep(ctx, G, 'harmonie', t0, m, n * BAR - 0.4, 0.018, -0.3 + i * 0.2));
          for (let m = 0; m < n; m++) (m % 2 ? [2, 5] : [3, 6]).forEach((c) => v.forEach((x, i) => ep(ctx, G, 'harmonie', t0 + m * BAR + c * X, x, X * 1.3, 0.035, -0.3 + i * 0.2, true)));
        }),
        melodie: (ctx, G) => {
          if (FLUTE[bi]) FLUTE[bi].forEach(([b, m, du]) => E(ctx, G, 'melodie', 'flute', 0.02 + b * TEMPS, m, du * TEMPS - 0.05, 0.35, { gain: 1.2, attack: 0.08, release: 0.6, send: 0.45, pan: 0.15 }));
          else K.accords(EXPLO[bi], (t0, n, r, v, j) => [0, 0.25, 0.5, 0.75].forEach((d, k) => E(ctx, G, 'melodie', 'harpe', t0 + (2 + j) * TEMPS + d, v[k % v.length] + 12, 2.5, 0.3, { gain: 1, send: 0.5, pan: -0.3 + k * 0.2 })));   // une petite cascade de harpe
        },
        /* MATIÈRE : la piscine, le cristal, la sonnette de la porte (bloc 3), un volet (bloc 4) */
        matiere: (ctx, G) => {
          S().piscine(ctx, G, 'matiere', 0.02, DUREE - 1, 0.03, -0.4);
          L.verreTinte(ctx, G, 'matiere', (1.6 + bi * 1.3) * BAR, { gain: 0.025, pan: 0.5 });
          if (bi === 2) L.jouerSfx(ctx, G, 'matiere', 4 * BAR, S().carillon(ctx), { gain: 0.08, pan: -0.5, send: 0.5 });
          if (bi === 3) L.jouerSfx(ctx, G, 'matiere', 2.2 * BAR, S().volet(ctx), { gain: 0.05, pan: 0.6, send: 0.3, lp: 2500 });
        }
      })
    },
    tension: {
      mix: { rt: [2.8, 2.2, 1.2], predelay: 0.02, verbWet: 0.35, tone: 8000, trim: {} },
      bloc: (bi) => ({
        pulsation: (ctx, G) => {
          const fr = balai(ctx, true);
          for (let m = 0; m < BLOC; m++) {
            const n = bi === 0 ? (m < 4 ? 3 : m < 6 ? 4 : 6) : (m < 2 ? 4 : 6);
            for (let k = 0; k < n; k++) { L.jouerSfx(ctx, G, 'pulsation', 0.02 + m * BAR + k * BAR / n, fr, { gain: 0.1, send: 0.2, lp: 2500 }); if (k === 0) basse(ctx, G, 'pulsation', 0.02 + m * BAR, 41, 0.3, 0.8); }
          }
        },
        texture: (ctx, G) => {
          [[53, -0.3], [60, 0.3]].forEach(([m, p]) => ep(ctx, G, 'texture', 0.02, m, DUREE - 2, 0.016, p));
          L.souffleAccorde(ctx, G, 'texture', 4 * BAR, bi ? 76 : 77, 4 * BAR - 1.5, 1, { couleur: 'verre', gain: 0.012, attack: 3, release: 3, pan: 0.4 });   // mi♮, fa
          L.sousBasse(ctx, G, 'texture', 0.02, 41, DUREE - 2, 1, { gain: 0.035, attack: 1.5, release: 2.5 });
        },
        matiere: (ctx, G) => {
          [1.3, 4.6].forEach((m, k) => L.jouerSfx(ctx, G, 'matiere', (m + bi * 0.5) * BAR, S().volet(ctx), { gain: 0.05, pan: k ? 0.6 : -0.6, send: 0.3, lp: 2500 }));
          L.verreTinte(ctx, G, 'matiere', (3 + bi) * BAR, { gain: 0.03, pan: 0.3 });
        }
      })
    },
    danger: {
      mix: { rt: [2.2, 1.8, 1], predelay: 0.01, verbWet: 0.28, tone: 10000, trim: {} },
      bloc: (bi) => ({
        /* Le groove se casse : la clave arrive à contretemps, les balais frappent, une cymbale crue */
        percussions: (ctx, G) => {
          const fr = balai(ctx, true);
          for (let p = 0; p < BLOC / 2; p++) {
            const t0 = 0.02 + p * 2 * BAR;
            [0, 3, 6, 9, 12, 14].forEach((c, k) => L.jouerSfx(ctx, G, 'percussions', t0 + c * X, fr, { gain: k % 3 ? 0.32 : 0.45, pan: [-0.2, 0.2, -0.1, 0.3, -0.3, 0.1][k], send: 0.2 }));
            [1, 7, 11].forEach((c) => P(ctx, G, 'percussions', t0 + c * X, /claves_mf/, 0.7, { pan: 0.4, send: 0.2 }));
            P(ctx, G, 'percussions', t0, /slitdrum0_mp/, 0.9, { send: 0.2 });
          }
          [0, 4].forEach((m) => P(ctx, G, 'percussions', 0.02 + m * BAR, /susp_hit_metal_2/, 0.35, { send: 0.3 }));
        },
        basse: (ctx, G) => { for (let p = 0; p < BLOC / 2; p++) [[0, 41], [3, 41], [6, 44], [9, 41], [12, bi && p >= 2 ? 42 : 40], [14, 41]].forEach(([c, n], k) => basse(ctx, G, 'basse', 0.02 + p * 2 * BAR + c * X, n, X * (k < 4 ? 2.6 : 1.6), k ? 0.45 : 0.55, true)); },
        stridences: (ctx, G) => {
          [1, 3, 5, 7].forEach((m) => L.verreElectrique(ctx, G, 'stridences', 0.02 + (m + rnd(0.1, 0.5)) * BAR, 88, 1.2 * BAR, 1, { gain: 0.006 }));
          L.vent(ctx, G, 'stridences', 0.02, DUREE - 0.5, 1, { gain: 0.03, center: 2400 });
        },
        nombre: (ctx, G) => {
          const fr = balai(ctx, true);
          for (let p = 0; p < BLOC / 2; p++) { const t0 = 0.02 + p * 2 * BAR; [1, 4, 7, 10, 13, 15].forEach((c) => L.jouerSfx(ctx, G, 'nombre', t0 + c * X, fr, { gain: 0.1, pan: rnd(-0.6, 0.6), send: 0.2 })); [2, 8].forEach((c) => P(ctx, G, 'nombre', t0 + c * X, /slitdrum2_mp/, 0.6, { pan: rnd(-0.5, 0.5) })); }
          [2, 6].forEach((m) => P(ctx, G, 'nombre', 0.02 + m * BAR, /susp_hit_metal_2/, 0.3, { send: 0.3 }));
        },
        matiere: (ctx, G) => {
          [0.5, 4.5].forEach((m, k) => L.jouerSfx(ctx, G, 'matiere', (m + bi * 0.7) * BAR, S().verreBrise(ctx), { gain: 0.08, pan: k ? 0.5 : -0.5, send: 0.4 }));
          L.jouerSfx(ctx, G, 'matiere', (2.5 + bi) * BAR, S().volet(ctx), { gain: 0.06, pan: 0.3, send: 0.3 });
        }
      })
    },
    signaux: {
      arriveeVilla: [8, (ctx, G) => {
        L.jouerSfx(ctx, G, 'matiere', 0.1, S().carillon(ctx), { gain: 0.25, pan: -0.3, send: 0.5 });
        [41, 56, 60, 63, 67].forEach((m, i) => (i ? ep(ctx, G, 'harmonie', 1.3 + i * 0.12, m, 3.5, 0.03, -0.3 + i * 0.15) : basse(ctx, G, 'basse', 1.3, m, 3.5, 1)));
      }],
      butinVilla: [6, (ctx, G) => {
        [[53, 0], [56, 0.18], [60, 0.36], [64, 0.54], [65, 0.9]].forEach(([m, d], i) => E(ctx, G, 'melodie', 'harpe', 0.05 + d, m + 12, 3, 0.5 - i * 0.04, { gain: 0.9, send: 0.6, pan: -0.3 + i * 0.15 }));   // fa la♭ do mi♮ fa : le mineur mélodique
        L.verreTinte(ctx, G, 'matiere', 1, { gain: 0.08, pan: 0.5 });
      }],
      sortieVilla: [8, (ctx, G) => {
        [[46, 56, 60, 62, 65], [41, 56, 60, 63, 67]].forEach((acc, j) => acc.forEach((m, i) => (i ? ep(ctx, G, 'harmonie', 0.1 + j * 2.6 + i * 0.1, m, j ? 3 : 2.3, 0.025, -0.3 + i * 0.15) : basse(ctx, G, 'basse', 0.1 + j * 2.6, m, j ? 3 : 2.3, 1))));
      }]
    },
    /* L'enceinte de la domotique joue encore son lounge, en boucle, sur un seul petit haut-parleur qui grésille (8 mesures, 22,9 s) */
    diegetique: ['enceinte-villa', async (sr) => K.rendreBoucle(sr, DUREE, { couches: ['radio'], rt: [0.5, 0.4, 0.3], predelay: 0.005, verbWet: 0.06, tone: 12000, trim: {} }, (ctx, G, t) => {
      const sortie = L.voiceOut(ctx, G, 'radio', 0, 0.05); sortie.gain.value = 0.9;
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 380;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4200; hp.connect(lp); lp.connect(sortie);
      const Gp = { layers: { radio: hp }, layerVerb: { radio: hp }, layerEcho: {}, verbIn: hp, seule: null };   // tout passe par le petit haut-parleur
      const acc = [EXPLO[0][0], EXPLO[0][1], EXPLO[1][0], EXPLO[1][1]].map(([, , r, v], k) => [k * 2, 2, r, v]);
      K.accords(acc, (t0, n, r, v) => {
        for (let m = 0; m < n; m++) {
          RIFF.forEach(([c, iv, du]) => basse(ctx, Gp, 'radio', t + t0 + m * BAR + c * X, r + iv - (iv ? 12 : 0) + 12, du * X * 0.9, c ? 0.75 : 1));
          (m % 2 ? [2, 5] : [3, 6]).forEach((c) => v.forEach((x, i) => ep(ctx, Gp, 'radio', t + t0 + m * BAR + c * X, x, X * 1.3, 0.03, 0, true)));
        }
        v.forEach((x) => ep(ctx, Gp, 'radio', t + t0, x, n * BAR - 0.3, 0.012, 0));
      });
      for (let p = 0; p < BLOC / 2; p++) CLAVE.forEach((c) => P(ctx, Gp, 'radio', t + 0.02 + p * 2 * BAR + c * X, /claves_mf/, 0.5, { send: 0 }));
      const crac = L.sfxBuffer(ctx, 0.008, (d) => { for (let i = 0; i < d.length; i++) d[i] = (i % 5 < 2 ? 1 : -1) * (1 - i / d.length); });
      [0.4, 2.7, 6.1, 9.9, 13.2, 17.8, 21.5].forEach((x, k) => L.jouerSfx(ctx, Gp, 'radio', t + x, crac, { gain: 0.02 + 0.01 * (k % 2), send: 0 }));
    }), { boucle: true }]
  };

  window.WattKitVilla = { def, preparer: (sr, progres) => K.preparerKit(def, sr, progres), instruments: def.instruments, BAR, DUREE_BLOC: DUREE };
})();
