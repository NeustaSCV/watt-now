/* Watt Now? — la Coopérative du Plateau (Book 23) : ESQUISSE, proposition à valider.
   Tonique MI : le terrain est en ré, la halte en la, la coopérative en mi. On s'éloigne de la maison par quintes
   (ré → la → mi), comme on s'en éloigne à pied (deux traversées).
   La musique suit la PROFONDEUR plutôt que la seule menace :
     Dehors  (cour, quai, libre-service, silos) : Fond des silos + Exploration en mi majeur harmonique (la nostalgie du iv mineur)
     Dedans  (atelier, hangar, bureaux)         : la musique se retire ; mi éolien, un trou dans le spectre pour les bruits
     Froid   (chambre froide)                   : presque rien, il faut entendre respirer les dormants
   Tension et Danger : propres au lieu, sur la métrique de la coopérative (3+3+3+3+2+2 sur deux mesures).
   Même grille que le terrain : 84 BPM, blocs de 8 mesures + 1 mesure de queue.
   Dépend de esquisses/js/moteur.js (WattMusique), theme-principal/echantillonneur.js (WattEchantillons), sons.js (WattCoop). */
(function () {
  'use strict';
  const L = window.WattMusique.lib, rnd = L.rnd, mtof = L.mtof, E = () => window.WattEchantillons, S = () => window.WattCoop;
  const BPM = 84, TEMPS = 60 / BPM, BAR = 4 * TEMPS, BLOC = 8, DUREE = BLOC * BAR, X = TEMPS / 2;
  /* La métrique de la coopérative : 16 croches sur 2 mesures, groupées 3+3+3+3+2+2 (la halte : 3+3+2 par mesure) */
  const ACCENTS = [0, 3, 6, 9, 12, 14];

  function fonduFin(buf, sec) {
    const n = Math.floor(sec * buf.sampleRate);
    for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c), L0 = d.length; for (let i = 0; i < n; i++) d[L0 - n + i] *= 1 - i / n; }
    return buf;
  }
  async function rendreStem(mix, couche, fn, sr) {
    const ctx = new OfflineAudioContext(2, Math.ceil(sr * (BLOC + 1) * BAR), sr);
    const G = L.buildGraph(ctx, Object.assign({}, mix, { seule: couche }));
    fn(ctx, G);
    return fonduFin(await ctx.startRendering(), 0.6);
  }

  /* ======================= DEHORS ======================= */
  const MIX_DEHORS = { rt: [3.8, 3, 1.4], predelay: 0.035, verbWet: 0.42, tone: 9000, trim: {}, couches: ['fond', 'texture', 'pulsation', 'basse', 'harmonie', 'melodie'] };

  /* Fond : les silos (grands cylindres, la couleur « cuve » une octave plus bas que la halte), le vent du plateau */
  function blocFond(bi) {
    return {
      nappe: (ctx, G) => {
        L.souffleAccorde(ctx, G, 'fond', 0.02, 28, DUREE - 2, 1, { couleur: 'cuve', gain: 0.05, attack: 3.5, release: 3.5, pan: -0.2 });
        L.souffleAccorde(ctx, G, 'fond', 1.5, 35, DUREE - 4, 1, { couleur: 'cuve', gain: 0.028, attack: 4, release: 3, pan: 0.3 });
        if (bi === 1) L.souffleAccorde(ctx, G, 'fond', 4 * BAR, 80, 3 * BAR, 1, { couleur: 'verre', gain: 0.007, attack: 4, release: 3, pan: 0.5 });   // un sol♯ très haut : la lumière du majeur
      },
      texture: (ctx, G) => {
        L.vent(ctx, G, 'texture', 0.02, DUREE - 0.5, 1, { gain: 0.035, center: 520 });
        L.feuillage(ctx, G, 'texture', 0.02, DUREE - 1, 1, { gain: 0.006, pan: 0.4 });
        L.jouerSfx(ctx, G, 'texture', (bi ? 5.4 : 2.2) * BAR, S().grainCoule(ctx, 2.4), { gain: 0.09, pan: bi ? 0.5 : -0.45, send: 0.5, hp: 1500 });
        if (bi === 0) L.oiseau(ctx, G, 'texture', 6.3 * BAR, { gain: 0.008, pan: -0.7 });
        L.ticMetal(ctx, G, 'texture', (bi ? 1.7 : 4.6) * BAR, { gain: 0.012 });
      }
    };
  }

  /* Exploration : mi majeur harmonique. [fondamentale, accord] par moitié de bloc (4 mesures).
     Le do♮ (♭6) du la mineur sous le mi majeur : la ferme d'avant, les moissons qui ne reviendront pas. */
  const EXPLO = [
    [[40, [56, 59, 64, 66]], [45, [57, 60, 64, 66]]],      // Mi add9 · la m6 (la do mi fa♯)
    [[37, [56, 59, 61, 64]], [45, [57, 60, 64, 71]]],      // do♯ m7 · la m add9
    [[42, [54, 57, 60, 64]], [47, [57, 59, 63, 66]]],      // fa♯ m7♭5 · si 7 (le ré♯)
    [[44, [56, 59, 63, 64]], [45, [57, 60, 64, 66]]]       // Mi maj7 / sol♯ · la m6 → retour au Mi (cadence plagale mineure)
  ];
  function blocExplo(bi) {
    return {
      /* Les palettes frappées sur la métrique de la coopérative ; le grain sur les contretemps ; la bascule en tête de phrase */
      pulsation: (ctx, G) => {
        const C = S(), hauts = [C.palette(ctx, 64, 1), C.palette(ctx, 64, 0.9)], bas = [C.palette(ctx, 59, 1), C.palette(ctx, 52, 1)], doux = [C.palette(ctx, 71, 0.5), C.palette(ctx, 68, 0.5)];
        for (let p = 0; p < BLOC / 2; p++) {
          const t0 = 0.02 + p * 2 * BAR;
          ACCENTS.forEach((c, k) => {
            if (bi === 0 && k % 2) return;                                    // bloc 1 : clairsemé
            const b = k === 0 ? bas[1] : (k === 3 ? bas[0] : L.pick(hauts));
            L.jouerSfx(ctx, G, 'pulsation', t0 + c * X, b, { gain: k === 0 ? 0.48 : 0.32, pan: [-0.1, 0.25, -0.3, 0.1, 0.35, -0.2][k], send: 0.25 });
          });
          if (bi >= 2) [2, 5, 8, 11].forEach((c) => L.jouerSfx(ctx, G, 'pulsation', t0 + c * X, L.pick(doux), { gain: 0.13, pan: 0.4, send: 0.3 }));
        }
        if (bi % 2 === 0) L.jouerSfx(ctx, G, 'pulsation', 0.02, S().bascule(ctx), { gain: 0.25, pan: -0.3, send: 0.35 });
      },
      /* Violoncelles en pizzicato sur les appuis, et le sous-bourdon */
      basse: (ctx, G) => {
        EXPLO[bi].forEach(([r], j) => {
          const t0 = 0.02 + j * 4 * BAR;
          for (let p = 0; p < 2; p++) [[0, r, 0.6], [6, r + 7, 0.45], [12, r + 12, 0.4]].forEach(([c, m, v]) => {
            if (bi === 0 && c === 12) return;
            E().jouer(ctx, G, 'basse', 'celloPizz', t0 + p * 2 * BAR + c * X, m, 1.2, v, { gain: 0.65, send: 0.25 });
          });
          L.sousBasse(ctx, G, 'basse', t0, r - 12, 4 * BAR - 1, 1, { gain: 0.035, attack: 1.5, release: 2 });
        });
      },
      /* L'accord en souffle de bois (le grenier), un harmonium très loin dans les blocs 2 et 4 */
      harmonie: (ctx, G) => {
        EXPLO[bi].forEach(([, v], j) => {
          const t0 = 0.02 + j * 4 * BAR, der = j === 1;
          v.forEach((m, i) => L.souffleAccorde(ctx, G, 'harmonie', t0 + i * 0.35, m, 4 * BAR + (der ? -2 : 1.5), 1, { couleur: 'bois', gain: 0.024, attack: 2.5, release: der ? 3.5 : 3, pan: -0.45 + i * 0.3 }));
          if (bi % 2 === 1) v.slice(0, 3).forEach((m, i) => L.harmonium(ctx, G, 'harmonie', t0 + 0.6, m, 4 * BAR - 1.5, 1, { gain: 0.012, attack: 2.5, release: 2.5, pan: 0.3 - i * 0.2, cutoff: 1300 }));
        });
      },
      /* Peu de mélodie : quelques notes de harpe ; le motif (mi fa♯ sol♯ si — do — si) seulement au bloc 4 */
      melodie: (ctx, G) => {
        const H = (t, m, v, pan) => E().jouer(ctx, G, 'melodie', 'harpe', t, m, 2.5, v, { gain: 0.65, pan: pan || 0, send: 0.55 });
        if (bi === 3) {
          [[0, 64, 0.5], [1, 66, 0.45], [2, 68, 0.5], [3, 71, 0.55]].forEach(([b, m, v]) => H(0.02 + 1 * BAR + b * TEMPS, m, v, 0.2));
          H(0.02 + 4 * BAR, 72, 0.55, 0.25); H(0.02 + 4 * BAR + 2 * TEMPS, 71, 0.45, 0.25);       // le do du la mineur, puis le si : le soupir
          H(0.02 + 6 * BAR, 64, 0.35, -0.2); H(0.02 + 6 * BAR + 1.5 * TEMPS, 68, 0.3, -0.1);
        } else {
          EXPLO[bi].forEach(([, v], j) => [[1, 0.5], [2, 2.5]].forEach(([m, beat], k) => {
            if ((bi + j + k) % 3 === 2) return;
            H(0.02 + (j * 4 + m) * BAR + beat * TEMPS, v[(k + bi + 1) % v.length] + 12, 0.35, -0.3 + k * 0.5);
          }));
        }
      }
    };
  }

  /* ======================= DEDANS (atelier, hangar, bureaux) =======================
     La musique se retire. Mi éolien ; un TROU dans le spectre entre ≈ 250 Hz et 2 kHz, où vivent les râles,
     les pas et le raclement des Rampants : la musique ne joue que dessous (bourdon) et dessus (verre). */
  const MIX_DEDANS = { rt: [4.5, 3.6, 1.6], predelay: 0.05, verbWet: 0.5, tone: 9000, trim: {}, couches: ['fond', 'texture'] };
  function blocDedans(bi) {
    return {
      nappe: (ctx, G) => {
        const graves = bi === 0 ? [[0, 28, 8]] : [[0, 36, 6], [6, 35, 2]];                       // mi · do, puis si (la dominante)
        graves.forEach(([m, n, d]) => L.sousBasse(ctx, G, 'fond', 0.02 + m * BAR, n, d * BAR - 1, 1, { gain: 0.028, attack: 2.5, release: 2.5 }));
        L.souffleAccorde(ctx, G, 'fond', 0.02, bi === 0 ? 40 : 36, 6 * BAR, 1, { couleur: 'metal', gain: 0.022, attack: 4, release: 3, pan: -0.3 });   // la tôle du toit, très grave
        const hauts = bi === 0 ? [[1, 76, 4], [4, 79, 4]] : [[0, 79, 5], [3, 83, 3], [6, 75, 2]];  // mi, sol · sol, si, ré♯ (la couleur du mineur harmonique, commune aux familles)
        hauts.forEach(([m, n, d], i) => L.souffleAccorde(ctx, G, 'fond', 0.02 + m * BAR, n, d * BAR, 1, { couleur: 'verre', gain: 0.009, attack: 3, release: 3, pan: i % 2 ? 0.5 : -0.4 }));
      },
      texture: (ctx, G) => {
        const C = S();
        L.vent(ctx, G, 'texture', 0.02, DUREE - 0.5, 1, { gain: 0.008, center: 180 });
        L.jouerSfx(ctx, G, 'texture', (bi ? 3.2 : 5.6) * BAR, C.toleHangar(ctx), { gain: 0.12, pan: bi ? -0.5 : 0.4, send: 0.8, lp: 260 });
        L.goutte(ctx, G, 'texture', (bi ? 6.1 : 1.8) * BAR, { gain: 0.01, pan: bi ? 0.6 : -0.6 });
        if (bi === 1) L.jouerSfx(ctx, G, 'texture', 0.9 * BAR, C.rayonnage(ctx, 88, 0.4), { gain: 0.03, pan: 0.7, send: 1, hp: 2200 });   // un montant qui sonne au loin, très haut
      }
    };
  }

  /* ======================= CHAMBRE FROIDE =======================
     Presque rien : un mi à 41 Hz qu'on sent plus qu'on n'entend, un si très haut qui apparaît et s'en va. */
  function blocFroid(bi) {
    return {
      nappe: (ctx, G) => {
        L.sousBasse(ctx, G, 'fond', 0.02, 28, DUREE - 2, 1, { gain: 0.02, attack: 5, release: 4 });
        L.souffleAccorde(ctx, G, 'fond', (bi ? 4 : 2) * BAR, bi ? 92 : 95, 3 * BAR, 1, { couleur: 'verre', gain: 0.003, attack: 5, release: 4, pan: bi ? -0.3 : 0.3 });   // si, puis sol♯, très haut
      },
      texture: () => {}
    };
  }
  /* Une zone = un stem de la pièce de Fond (nappe et texture prémixées) : le directeur passe d'un stem à l'autre à la mesure */
  const ZONES = { dehors: [MIX_DEHORS, blocFond], dedans: [MIX_DEDANS, blocDedans], froid: [MIX_DEDANS, blocFroid] };
  function blocZone(zone, bi) { const f = ZONES[zone][1](bi); return (ctx, G) => { f.nappe(ctx, G); f.texture(ctx, G); }; }

  /* ======================= TENSION =======================
     Le battement sourd et les montants de rayonnage frappés, en 3 contre 4 qui se resserre (comme au terrain),
     sur le bourdon mi-si des silos. */
  const MIX_TENSION = { rt: [3.5, 2.8, 1.4], predelay: 0.02, verbWet: 0.4, tone: 7000, trim: {}, couches: ['rythmique', 'harmonie'] };
  function battement(ctx) {
    return L.sfxBuffer(ctx, 0.6, (d, sr) => {
      let ph = 0;
      for (let i = 0; i < 0.5 * sr; i++) { const s = i / sr, f = 41 + 26 * Math.exp(-s / 0.04); ph += 2 * Math.PI * f / sr; d[i] = Math.sin(ph) * Math.exp(-s / 0.14) * Math.min(1, s / 0.004); }
    });
  }
  function blocTension(bi) {
    return {
      pulsation: (ctx, G) => {
        const b = battement(ctx), r = [S().rayonnage(ctx, 76, 0.7), S().rayonnage(ctx, 83, 0.6), S().rayonnage(ctx, 79, 0.6)];
        for (let m = 0; m < BLOC; m++) {
          const n = bi === 0 ? (m < 4 ? 3 : m < 6 ? 4 : 6) : (m < 2 ? 4 : 6);
          for (let k = 0; k < n; k++) L.jouerSfx(ctx, G, 'rythmique', 0.02 + m * BAR + k * BAR / n, b, { gain: 0.32 * (k === 0 ? 1 : 0.75), send: 0.15, lp: 900 });
          if (m >= (bi === 0 ? 2 : 0) && m % 2 === 0) ACCENTS.forEach((c, i) => { if (i % 2 === 0 || bi === 1) L.jouerSfx(ctx, G, 'rythmique', 0.02 + m * BAR + c * X, r[i % 3], { gain: 0.035 + 0.015 * (m / BLOC), pan: [-0.4, 0.3, 0.1, -0.2, 0.45, -0.35][i], send: 0.45, hp: 1800 }); });
        }
      },
      texture: (ctx, G) => {
        L.souffleAccorde(ctx, G, 'harmonie', 0.02, 40, DUREE - 1.5, 1, { couleur: 'cuve', gain: 0.05, attack: 1.5, release: 3, pan: -0.2 });
        L.souffleAccorde(ctx, G, 'harmonie', 0.5, 47, DUREE - 2, 1, { couleur: 'fond', gain: 0.03, attack: 3, release: 3, pan: 0.2 });
        L.souffleAccorde(ctx, G, 'harmonie', 4 * BAR, bi ? 75 : 76, 4 * BAR - 1.5, 1, { couleur: 'metal', gain: 0.018, attack: 4, release: 3, pan: 0.4 });
        L.vent(ctx, G, 'harmonie', 0.02, DUREE - 0.5, 1, { gain: 0.025, center: 900 });
      }
    };
  }

  /* ======================= DANGER =======================
     La métrique de l'Exploration, durcie : les palettes deviennent de la tôle et des montants d'acier.
     Stem « nombre » : quand 3 Éteints ou plus sont sur le joueur, il s'ajoute au Danger et remplit la grille (contretemps de tôle,
     montants plus forts, la bascule qui retombe). Deux blocs, variantes l'un de l'autre. */
  const MIX_DANGER = { rt: [2.4, 2, 1.1], predelay: 0.01, verbWet: 0.3, tone: 10000, trim: {}, couches: ['rythmique', 'basse', 'harmonie', 'nombre'] };
  function tole(ctx, grave) {
    const f0 = grave ? rnd(95, 120) : rnd(150, 190);
    return L.sfxBuffer(ctx, 1.6, (d, sr, Ln) => {
      const x = new Float32Array(Ln); for (let i = 0; i < 0.004 * sr; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / (0.004 * sr));
      L.resonner(x, d, sr, [[f0, 1, 0.45], [f0 * 1.58, 0.8, 0.35], [f0 * 2.33, 0.7, 0.25], [f0 * 3.1, 0.5, 0.18], [f0 * 4.4, 0.4, 0.12], [f0 * 5.9, 0.3, 0.08]]);
    });
  }
  function basseSaturee(ctx, G, t, midi, dur, vel) {
    const amp = L.voiceOut(ctx, G, 'basse', 0, 0.05);
    const ws = ctx.createWaveShaper(), cv = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = (i / 1023) * 2 - 1; cv[i] = Math.tanh(4 * x); }
    ws.curve = cv;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600; lp.Q.value = 1.2;
    const a = ctx.createOscillator(); a.type = 'sawtooth'; a.frequency.value = mtof(midi);
    const b = ctx.createOscillator(); b.type = 'square'; b.frequency.value = mtof(midi) / 2; const bg = ctx.createGain(); bg.gain.value = 0.5;
    a.connect(ws); b.connect(bg); bg.connect(ws); ws.connect(lp); lp.connect(amp);
    amp.gain.setValueAtTime(0, t); amp.gain.linearRampToValueAtTime(0.09 * vel, t + 0.01); amp.gain.setTargetAtTime(0.05 * vel, t + 0.02, 0.1); amp.gain.setTargetAtTime(0, t + dur, 0.06);
    [a, b].forEach((o) => { o.start(t); o.stop(t + dur + 0.5); });
  }
  /* La basse sur les accents : mi, mi, sol, mi, ré, ré (le ♭7 qui ne se résout pas) */
  const DANGER_BASSE = [40, 40, 43, 40, 38, 38];
  function blocDanger(bi) {
    return {
      percussions: (ctx, G) => {
        const t1 = tole(ctx, false), t2 = tole(ctx, true), rs = [S().rayonnage(ctx, 64, 1), S().rayonnage(ctx, 71, 1)];
        for (let p = 0; p < BLOC / 2; p++) {
          const t0 = 0.02 + p * 2 * BAR;
          ACCENTS.forEach((c, k) => L.jouerSfx(ctx, G, 'rythmique', t0 + c * X, k === 0 || k === 3 ? t2 : t1, { gain: k === 0 ? 0.38 : 0.25, pan: [0, -0.35, 0.35, -0.1, 0.4, -0.4][k], send: 0.25 }));
          [2, 5, 8, 11].forEach((c) => { if (bi === 0 || c !== 5) L.jouerSfx(ctx, G, 'rythmique', t0 + c * X, L.pick(rs), { gain: 0.07, pan: rnd(-0.6, 0.6), send: 0.3, hp: 900 }); });
        }
      },
      nombre: (ctx, G) => {
        const t1 = tole(ctx, false), rs = [S().rayonnage(ctx, 64, 1), S().rayonnage(ctx, 71, 1), S().rayonnage(ctx, 76, 1)];
        for (let p = 0; p < BLOC / 2; p++) {
          const t0 = 0.02 + p * 2 * BAR;
          [1, 4, 7, 10, 13, 15].forEach((c) => L.jouerSfx(ctx, G, 'nombre', t0 + c * X, t1, { gain: 0.1, pan: rnd(-0.7, 0.7), send: 0.2, lp: 2200 }));
          [2, 5, 8, 11].forEach((c) => L.jouerSfx(ctx, G, 'nombre', t0 + c * X, L.pick(rs), { gain: 0.07, pan: rnd(-0.6, 0.6), send: 0.3, hp: 900 }));
        }
        [0, 4].forEach((m) => L.jouerSfx(ctx, G, 'nombre', 0.02 + m * BAR, S().bascule(ctx), { gain: 0.35, send: 0.3, pan: m ? 0.3 : -0.3 }));
        L.grincementMetal(ctx, G, 'nombre', 0.02 + (bi ? 2.3 : 6.3) * BAR, { gain: 0.07 });
      },
      basse: (ctx, G) => {
        for (let p = 0; p < BLOC / 2; p++) ACCENTS.forEach((c, k) => basseSaturee(ctx, G, 0.02 + p * 2 * BAR + c * X, DANGER_BASSE[k] - (bi === 1 && p >= 2 && k === 2 ? 2 : 0), X * (k < 4 ? 2.6 : 1.6), k === 0 ? 1 : 0.8));
      },
      stridences: (ctx, G) => {
        [1, 3, 5, 7].forEach((m) => L.grincementMetal(ctx, G, 'harmonie', 0.02 + (m + rnd(0.1, 0.6)) * BAR, { gain: bi ? 0.08 : 0.06 }));
        L.vent(ctx, G, 'harmonie', 0.02, DUREE - 0.5, 1, { gain: 0.045, center: 2400 });
      }
    };
  }

  /* ======================= SIGNAUX ======================= */
  async function signal(nom, sr) {
    const sec = { arriveeCoop: 9, butin: 6, sortieCoop: 9 }[nom];
    const ctx = new OfflineAudioContext(2, Math.ceil(sr * sec), sr);
    const G = L.buildGraph(ctx, { couches: ['fond', 'harmonie', 'melodie', 'effets'], rt: [4.5, 3.5, 1.5], predelay: 0.02, verbWet: 0.5, tone: 9000, trim: {} });
    if (nom === 'arriveeCoop') {        // la bascule qui retombe sous les pieds, puis les silos qui s'éveillent : mi, si, sol♯
      L.jouerSfx(ctx, G, 'effets', 0.05, S().bascule(ctx), { gain: 0.5, send: 0.5 });
      [[40, 0.4, 'cuve', 0.06], [47, 1.2, 'cuve', 0.04], [68, 2.2, 'verre', 0.012]].forEach(([m, d, c, g]) => L.souffleAccorde(ctx, G, 'harmonie', d, m, 3, 1, { couleur: c, gain: g, attack: 1.5, release: 3.5 }));
    } else if (nom === 'butin') {       // la harpe monte (mi sol♯ si ré♯), un rayonnage tinte très haut : c'est rare, on le sait
      [[64, 0], [68, 0.18], [71, 0.36], [75, 0.54], [76, 0.9]].forEach(([m, d], i) => E().jouer(ctx, G, 'melodie', 'harpe', 0.05 + d, m, 3, 0.55 - i * 0.04, { gain: 0.9, send: 0.6, pan: -0.3 + i * 0.15 }));
      L.jouerSfx(ctx, G, 'effets', 0.95, S().rayonnage(ctx, 88, 0.5), { gain: 0.08, pan: 0.5, send: 0.9, hp: 2000 });
      L.souffleAccorde(ctx, G, 'harmonie', 0.3, 52, 2.5, 1, { couleur: 'bois', gain: 0.03, attack: 0.8, release: 2.5 });
    } else if (nom === 'sortieCoop') {  // on repasse le portail, vivant : la m6 → Mi add9, la cadence de l'Exploration
      [[45, 57, 60, 66], [40, 56, 59, 66]].forEach((acc, j) => acc.forEach((m, i) => L.souffleAccorde(ctx, G, 'harmonie', 0.1 + j * 2.6 + i * 0.12, m, j ? 3 : 2.2, 1, { couleur: i ? 'bois' : 'cuve', gain: i ? 0.03 : 0.05, attack: 0.9, release: j ? 3.5 : 1.2, pan: -0.3 + i * 0.2 })));
      E().jouer(ctx, G, 'melodie', 'harpe', 2.75, 68, 3, 0.4, { gain: 0.8, send: 0.6, pan: 0.3 });
    }
    return fonduFin(await ctx.startRendering(), 0.5);
  }

  /* ======================= LA RADIO À PILES (son diégétique, leurre du Book 23 §4.7) =======================
     Une émission de la Compagnie : la réclame de l'« engrais Watty », dans le style du jingle de l'écran titre
     (do majeur kitsch, orgue de pub en « oum-pa », 132 BPM), un crooner qui chantonne, puis « Watt… Now? » et le glockenspiel.
     44 temps (20 s), puis la radio grésille entre deux réclames. Boucle parfaite : on rend deux passages et on garde le second,
     dont le début contient la queue du premier. Mono : c'est le jeu qui la place dans l'espace (jouerEffet, portée de signature). */
  const JB = 60 / 132, BOUCLE_RADIO = 44;
  const RADIO_MEL = [[67, 0, 1], [72, 1, 1], [76, 2, 1], [79, 3, 1], [81, 4, 1], [79, 5, 1], [76, 6, 1], [72, 7, 1],
    [74, 8, 1], [76, 9, 1], [77, 10, 1], [81, 11, 1], [79, 12, 4],
    [67, 16, 1], [72, 17, 1], [76, 18, 1], [79, 19, 1], [81, 20, 1], [83, 21, 1], [84, 22, 1], [86, 23, 1],
    [88, 24, 1], [86, 25, 1], [84, 26, 1], [81, 27, 1], [79, 28, 2], [76, 30, 1], [74, 31, 1]];
  /* [temps, durée, accord, basse] : do 6 · ré m7 → sol 7 · do · sol 7 · la m7 → sol 7, puis le do du slogan */
  const RADIO_ACC = [[0, 8, [60, 64, 67, 69], 36], [8, 4, [60, 62, 65, 69], 38], [12, 4, [59, 62, 65, 67], 43], [16, 4, [60, 64, 67, 72], 36],
    [20, 4, [59, 62, 65, 67], 43], [24, 4, [60, 64, 67, 69], 45], [28, 4, [59, 62, 65, 67], 43], [32, 4, [60, 64, 67, 69, 74], 36]];
  const OUH = (d) => [[0, 330, 700, 2450, 0.5], [0.1, 420, 780, 2450, 1], [d - 0.1, 400, 760, 2400, 0.9]];
  const WATT = [[0, 300, 610, 2200, 0.35], [0.07, 640, 1000, 2450, 1], [0.85 * JB - 0.05, 620, 1050, 2450, 1]];
  const NOW = [[0, 260, 1500, 2550, 0.35], [0.07, 270, 1450, 2550, 0.4], [0.12, 720, 1200, 2500, 1], [0.5, 700, 1150, 2450, 1], [0.9, 420, 880, 2300, 0.9], [3 * JB, 400, 820, 2250, 0.85]];
  function passageRadio(ctx, G, t, entree, vEntree, oscs) {
    const R = window.WattThemePrincipal.radio;
    RADIO_MEL.forEach(([m, b, d]) => R.orgue(ctx, entree, t + b * JB, m, d * JB * 0.9, 0.45, oscs));
    RADIO_ACC.forEach(([b, d, notes, basse]) => {
      notes.forEach((m) => R.orgue(ctx, entree, t + b * JB, m, d * JB - 0.03, b >= 32 ? 0.08 : 0.12, oscs));
      for (let k = 0; k < d; k++) R.orgue(ctx, entree, t + (b + k) * JB, k % 2 ? basse + 7 : basse, 0.4 * JB, 0.32, oscs);   // « oum-pa »
    });
    /* Le crooner chantonne « ouh » sur les notes longues, une octave sous l'orgue */
    [[12, 4, 55], [28, 2, 55], [30, 1, 52], [31, 1, 50]].forEach(([b, d, m]) => R.voix(ctx, vEntree, t + b * JB, m, d * JB, OUH(d * JB), oscs, 0.5, { vibrato: 14 }));
    /* Le slogan : « Watt… Now? » (et la seconde voix à la tierce), le glockenspiel */
    [[55, 60, 1], [52, 57, 0.3]].forEach(([w, n, nv]) => {
      R.voix(ctx, vEntree, t + 32 * JB, w, 0.85 * JB, WATT, oscs, 0.7 * nv, { t: true });
      R.voix(ctx, vEntree, t + 33 * JB, n, 3 * JB, NOW, oscs, 0.7 * nv, { vibrato: 18, glisse: 60 });
    });
    E().jouer(ctx, G, 'radio', 'glock', t + 33 * JB, 84, 1.5, 0.6, { gain: 0.25, send: 0 });
    E().jouer(ctx, G, 'radio', 'glock', t + 33.5 * JB, 88, 1.5, 0.6, { gain: 0.22, send: 0 });
  }
  async function radioCompagnie(sr) {
    const P = BOUCLE_RADIO * JB, ctx = new OfflineAudioContext(1, Math.ceil(sr * 2 * P), sr);
    const G = L.buildGraph(ctx, { couches: ['radio'], rt: [0.6, 0.5, 0.3], predelay: 0.005, verbWet: 0.08, tone: 12000, trim: {} });
    const oscs = [], sortie = L.voiceOut(ctx, G, 'radio', 0, 0.1); sortie.gain.value = 0.22;
    /* Le petit poste : bande étroite et saturation pour l'orgue ; la voix plus propre, pour qu'on comprenne « Watt Now? » */
    const entree = ctx.createGain(), hp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter(), ws = ctx.createWaveShaper(), cv = new Float32Array(1024);
    hp.type = 'highpass'; hp.frequency.value = 420; lp.type = 'lowpass'; lp.frequency.value = 3200;
    for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; cv[i] = Math.tanh(2.2 * x); } ws.curve = cv;
    entree.connect(hp); hp.connect(lp); lp.connect(ws); ws.connect(sortie);
    const vEntree = ctx.createGain(), vhp = ctx.createBiquadFilter(), vlp = ctx.createBiquadFilter();
    vhp.type = 'highpass'; vhp.frequency.value = 230; vlp.type = 'lowpass'; vlp.frequency.value = 3800;
    vEntree.connect(vhp); vhp.connect(vlp); vlp.connect(sortie);
    [0, P].forEach((t) => passageRadio(ctx, G, t, entree, vEntree, oscs));
    /* Le souffle de la radio, continu, et des craquements (fixés : la boucle doit être identique d'un passage à l'autre) */
    const souffle = ctx.createBufferSource(); souffle.buffer = L.noiseLong(ctx); souffle.loop = true;
    const sb = ctx.createBiquadFilter(); sb.type = 'bandpass'; sb.frequency.value = 2400; sb.Q.value = 0.7;
    const sg = L.voiceOut(ctx, G, 'radio', 0, 0); sg.gain.value = 0.004; souffle.connect(sb); sb.connect(sg); souffle.start(0);
    const crac = L.sfxBuffer(ctx, 0.01, (d) => { for (let i = 0; i < d.length; i++) d[i] = (i % 7 < 3 ? 1 : -1) * (1 - i / d.length); });
    [0.7, 3.1, 5.2, 9.8, 12.4, 15.9, 17.3, 18.6, 19.2].forEach((x, k) => [0, P].forEach((t) => L.jouerSfx(ctx, G, 'radio', t + x, crac, { gain: 0.01 + 0.004 * (k % 3), send: 0 })));
    const tout = await ctx.startRendering(), n0 = Math.round(P * sr), n = Math.round(P * sr);
    const buf = new AudioBuffer({ length: n, numberOfChannels: 1, sampleRate: sr });
    buf.copyToChannel(tout.getChannelData(0).subarray(n0, n0 + n), 0);
    return buf;
  }

  /** Toutes les pièces de la coopérative : { pieces, signaux, diegetiques, meta } ; progres(i, n, texte).
      Fond : un stem par zone. Danger : un stem « nombre » en plus. Format du moteur (moteur/moteur-couches.js). */
  async function preparer(sr, progres) {
    const pieces = {
      'fond-coop': { stems: ['dehors', 'dedans', 'froid'], blocs: [{}, {}] },
      'explo-coop': { stems: ['pulsation', 'basse', 'harmonie', 'melodie'], blocs: [{}, {}, {}, {}] },
      'tension-coop': { stems: ['pulsation', 'texture'], blocs: [{}, {}] },
      'danger-coop': { stems: ['percussions', 'basse', 'stridences', 'nombre'], blocs: [{}, {}] }
    };
    const T = [], ajoute = (id, bi, stem, mix, couche, fn) => T.push([id + ' ' + (bi + 1) + ', ' + stem, async () => { pieces[id].blocs[bi][stem] = await rendreStem(mix, couche, fn, sr); }]);
    [0, 1].forEach((bi) => {
      Object.keys(ZONES).forEach((z) => ajoute('fond-coop', bi, z, ZONES[z][0], null, blocZone(z, bi)));
      const Te = blocTension(bi), Da = blocDanger(bi);
      ajoute('tension-coop', bi, 'pulsation', MIX_TENSION, 'rythmique', Te.pulsation); ajoute('tension-coop', bi, 'texture', MIX_TENSION, 'harmonie', Te.texture);
      ajoute('danger-coop', bi, 'percussions', MIX_DANGER, 'rythmique', Da.percussions); ajoute('danger-coop', bi, 'basse', MIX_DANGER, 'basse', Da.basse);
      ajoute('danger-coop', bi, 'stridences', MIX_DANGER, 'harmonie', Da.stridences); ajoute('danger-coop', bi, 'nombre', MIX_DANGER, 'nombre', Da.nombre);
    });
    [0, 1, 2, 3].forEach((bi) => ['pulsation', 'basse', 'harmonie', 'melodie'].forEach((s) => ajoute('explo-coop', bi, s, MIX_DEHORS, s, blocExplo(bi)[s])));
    const signaux = {}, diegetiques = {};
    ['arriveeCoop', 'butin', 'sortieCoop'].forEach((n) => T.push(['Signal ' + n, async () => { signaux[n] = await signal(n, sr); }]));
    T.push(['Radio de la Compagnie', async () => { diegetiques['radio-compagnie'] = await radioCompagnie(sr); }]);
    for (let i = 0; i < T.length; i++) { if (progres) progres(i, T.length, T[i][0]); await T[i][1](); }
    if (progres) progres(T.length, T.length, 'Prêt');
    const meta = {
      'fond-coop': { role: 'Fond coopérative : un stem par zone (dehors : silos et vent ; dedans : tôle, grave et verre ; froid : presque rien)', tonique: 'mi', mode: 'bourdon mi-si ; dedans : mi éolien, touche de ré♯',
        note: 'le directeur passe d\'un stem à l\'autre (changerZone) ; seul le stem de la zone est décodé', ciblesStems: { dehors: -26, dedans: -24, froid: -30 }, groupesMobile: { dehors: ['dehors'], dedans: ['dedans'], froid: ['froid'] } },
      'explo-coop': { role: 'Exploration coopérative (dehors seulement)', tonique: 'mi', mode: 'mi majeur harmonique (iv mineur)', metrique: '3+3+3+3+2+2 sur 2 mesures' },
      'tension-coop': { role: 'Tension (coopérative)', tonique: 'mi', mode: 'pulsation 3 contre 4, bourdon mi-si' },
      'danger-coop': { role: 'Danger (coopérative) ; stem « nombre » : 3 Éteints ou plus', tonique: 'mi', mode: 'mi, ré (♭7), 3+3+3+3+2+2',
        mesureSans: ['nombre'], groupesMobile: { base: ['percussions', 'basse', 'stridences'], nombre: ['nombre'] } }
    };
    return { pieces, signaux, diegetiques, meta };
  }

  window.WattCoopPieces = { preparer, radioCompagnie, instruments: ['celloPizz', 'harpe', 'glock'], BPM, TEMPS, BAR, DUREE_BLOC: DUREE, DUREE_RADIO: BOUCLE_RADIO * JB };
})();
