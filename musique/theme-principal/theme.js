/* Watt Now? — le réveil : jingle Watty, coupure de courant, puis le thème principal (Book 21 §6.1.1, moment-vitrine 1).
   84 BPM, 4/4. 52 mesures ≈ 2 min 29 s.

   Idée : le motif du jingle publicitaire (« Watt… Now? » : arpège qui monte, puis une quarte en question)
   devient le thème du jeu. En do majeur kitsch à la radio, puis, après la coupure, en ré dorien, lent et grave :
   l'ironie, puis la beauté. Motif : 5 1 3 5 6 5, puis la question 5 → 1 (quarte montante, laissée en suspens).

   Mesures   Partie                Mode                       Couleur
   0-3       Le réveil             do majeur (jingle)         orgue de pub à la radio, voix « Watt Now? », coupure, silence
   4-11      Naissance             ré (bourdon)               sons trouvés épars qui se calent peu à peu sur la grille 3+3+2
   12-19     🔥 Charbonniers        ré dorien                  violons en nappe, motif au violon solo (la ré fa la si la)
   20-27     ⚡ Voltaïques          si mineur harmonique       onde douce, motif au glockenspiel en écho
   28-35     ⚙️ Mécanistes          ré mixolydien              flûte, marimba, harpe, bambou
   36-43     Les trois ensemble    ré lydien                  violon (doublé du violoncelle) et flûte à l'octave, le sol♯ lydien
   44-51     Queue bouclable       ré lydien                  très doux ; boucle de la mesure 44 à 52 pour l'écran titre

   Stems : radio (jingle et coupure), rythmique (sons trouvés, percussions), basse, harmonie (nappes), melodie. */
(function () {
  'use strict';
  const BPM = 84, TEMPS = 60 / BPM, MESURE = 4 * TEMPS;
  const DEBUT = 4;      // le thème commence à la mesure 4 (après le jingle et le silence)
  const E = (...a) => window.WattEchantillons.jouer(...a);

  /* =================== Le réveil : jingle Watty à la radio, puis coupure =================== */

  /* Orgue de publicité des années 60 : tirettes (sinus 16', 8', 4', 2 2/3', 2'), clic de touche, vibrato de cabine tournante */
  function orgue(ctx, dest, t, midi, dur, vel, oscs) {
    const f = 440 * Math.pow(2, (midi - 69) / 12), g = ctx.createGain(); g.gain.value = 0; g.connect(dest);
    [[0.5, 0.5], [1, 1], [2, 0.7], [3, 0.35], [4, 0.25]].forEach(([r, a]) => {
      const o = ctx.createOscillator(); o.frequency.value = f * r;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 6.4; const lg = ctx.createGain(); lg.gain.value = 6; lfo.connect(lg); lg.connect(o.detune);
      const og = ctx.createGain(); og.gain.value = a * 0.2; o.connect(og); og.connect(g);
      o.start(t); o.stop(t + dur + 0.1); lfo.start(t); lfo.stop(t + dur + 0.1); oscs.push(o);
    });
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + 0.006); g.gain.setValueAtTime(vel, t + dur - 0.03); g.gain.linearRampToValueAtTime(0, t + dur);
  }
  /* Voix « Watt Now? » : un crooner de publicité, synthétisé par formants.
     Source glottique (harmoniques en 1/k^1,3) + souffle, quatre formants en parallèle aux largeurs d'une voix d'homme,
     consonnes : « w » (lèvres arrondies qui s'ouvrent), « t » (silence puis éclat), « n » (murmure nasal).
     Images clés : [instant (s), F1, F2, F3, niveau]. */
  function onde(ctx) { const n = 48, re = new Float32Array(n), im = new Float32Array(n); for (let k = 1; k < n; k++) im[k] = 1 / Math.pow(k, 1.3); return ctx.createPeriodicWave(re, im); }
  function voix(ctx, dest, t, midi, dur, cles, oscs, niveau, o) {
    o = o || {};
    const f = 440 * Math.pow(2, (midi - 69) / 12), fin = t + dur;
    const src = ctx.createOscillator(); src.setPeriodicWave(onde(ctx)); src.frequency.value = f; oscs.push(src);
    if (o.glisse) { src.detune.setValueAtTime(0, fin - 0.35); src.detune.linearRampToValueAtTime(o.glisse, fin); }   // « Now? » qui monte un peu : la question
    const vib = ctx.createOscillator(); vib.frequency.value = 5.4; const vg = ctx.createGain(); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(o.vibrato || 0, t + dur * 0.8); vib.connect(vg); vg.connect(src.detune);
    const souffle = ctx.createBufferSource(); souffle.buffer = window.WattMusique.lib.noiseBuffer(ctx); const sg = ctx.createGain(); sg.gain.value = 0.06; souffle.connect(sg);
    const env = ctx.createGain(); env.gain.value = 0; env.connect(dest);
    const Q = [8, 12, 16], GN = [1, 0.55, 0.3];
    const fs = [0, 1, 2].map((k) => { const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.Q.value = Q[k]; src.connect(b); sg.connect(b); const g = ctx.createGain(); g.gain.value = GN[k] * 3; b.connect(g); g.connect(env); return b; });
    const f4 = ctx.createBiquadFilter(); f4.type = 'bandpass'; f4.frequency.value = 3400; f4.Q.value = 18; src.connect(f4); const g4 = ctx.createGain(); g4.gain.value = 0.4; f4.connect(g4); g4.connect(env);
    cles.forEach(([dt, f1, f2, f3, a], i) => {
      const m = i ? 'linearRampToValueAtTime' : 'setValueAtTime';
      fs[0].frequency[m](f1, t + dt); fs[1].frequency[m](f2, t + dt); fs[2].frequency[m](f3, t + dt); env.gain[m](a * niveau, t + dt);
    });
    env.gain.setValueAtTime(cles[cles.length - 1][4] * niveau, fin - 0.04); env.gain.linearRampToValueAtTime(0, fin);
    if (o.t) {   // « t » : la langue ferme (silence), puis un petit éclat aigu
      const n = ctx.createBufferSource(); n.buffer = window.WattMusique.lib.noiseBuffer(ctx);
      const hp = ctx.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = 4200; hp.Q.value = 1.2;
      const ng = ctx.createGain(); ng.gain.setValueAtTime(0, fin + 0.05); ng.gain.linearRampToValueAtTime(0.9 * niveau, fin + 0.056); ng.gain.exponentialRampToValueAtTime(0.001, fin + 0.09);
      n.connect(hp); hp.connect(ng); ng.connect(dest); n.start(fin + 0.04, Math.random()); n.stop(fin + 0.12);
    }
    [src, vib].forEach((x) => { x.start(t); x.stop(fin + 0.05); });
    souffle.start(t, Math.random()); souffle.stop(fin + 0.05);
  }

  function reveil(ctx, G, t, L) {
    const jb = 60 / 132;                                   // le jingle a son propre tempo, entraînant
    const oscs = [];
    /* Chaîne « radio » : passe-haut, passe-bas, saturation, puis la couche radio */
    const entree = ctx.createGain(); entree.gain.value = 1;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 420;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
    const ws = ctx.createWaveShaper(), cv = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; cv[i] = Math.tanh(2.2 * x); } ws.curve = cv;
    const sortie = L.voiceOut(ctx, G, 'radio', 0.15, 0.15);
    entree.connect(hp); hp.connect(lp); lp.connect(ws); ws.connect(sortie);
    sortie.gain.setValueAtTime(0.2, t);
    /* Mélodie du jingle, à l'orgue (do majeur) : sol do mi sol la sol, mi do ré… « Watt » sol, « Now? » do */
    const MEL = [[67, 0, 0.5], [72, 0.5, 0.5], [76, 1, 0.5], [79, 1.5, 1], [81, 2.5, 0.5], [79, 3, 1], [76, 4, 0.5], [72, 4.5, 0.5], [74, 5, 1.5], [79, 7, 1], [84, 8, 3]];
    MEL.forEach(([m, b, d]) => orgue(ctx, entree, t + b * jb, m, d * jb, b >= 7 ? 0.12 : 0.55, oscs));   // l'orgue s'efface sous la voix
    const ACC = [[0, 4, [60, 64, 67, 69], 36], [4, 1, [60, 65, 69], 41], [5, 2, [59, 62, 65, 67], 43], [7, 4, [60, 64, 67, 69, 74], 36]];
    ACC.forEach(([b, d, notes, basse]) => {
      notes.forEach((m) => orgue(ctx, entree, t + b * jb, m, d * jb, b >= 7 ? 0.09 : 0.16, oscs));
      for (let k = 0; k < d; k += 1) orgue(ctx, entree, t + (b + k) * jb, k % 2 ? basse + 7 : basse, 0.4 * jb, 0.35, oscs);   // basse « oum-pa »
    });
    /* La voix : « Watt » (sol), « Now? » (do), une octave sous l'orgue */
    /* La voix passe par une radio propre (bande étroite, présence), sans la saturation de l'orgue : on doit comprendre les mots */
    const vEntree = ctx.createGain();
    const vhp = ctx.createBiquadFilter(); vhp.type = 'highpass'; vhp.frequency.value = 230;
    const vlp = ctx.createBiquadFilter(); vlp.type = 'lowpass'; vlp.frequency.value = 3800;
    const vpr = ctx.createBiquadFilter(); vpr.type = 'peaking'; vpr.frequency.value = 2200; vpr.gain.value = 4; vpr.Q.value = 1;
    vEntree.connect(vhp); vhp.connect(vlp); vlp.connect(vpr); vpr.connect(sortie);
    /* « Watt » : w (lèvres arrondies) → a ouvert ; « Now? » : n nasal → a → ou, qui monte un peu (la question).
       Un crooner (sol 3 puis do 4), et une seconde voix à la tierce, en retrait (mi 3, la 3) */
    const WATT = [[0, 300, 610, 2200, 0.35], [0.07, 640, 1000, 2450, 1], [0.85 * jb - 0.05, 620, 1050, 2450, 1]];
    const NOW = [[0, 260, 1500, 2550, 0.35], [0.07, 270, 1450, 2550, 0.4], [0.12, 720, 1200, 2500, 1], [0.5, 700, 1150, 2450, 1], [0.9, 420, 880, 2300, 0.9], [3 * jb, 400, 820, 2250, 0.85]];
    [[55, 60, 1], [52, 57, 0.3]].forEach(([w, n, nv]) => {
      voix(ctx, vEntree, t + 7 * jb, w, 0.85 * jb, WATT, oscs, 0.7 * nv, { t: true, vibrato: 0 });
      voix(ctx, vEntree, t + 8 * jb, n, 3 * jb, NOW, oscs, 0.7 * nv, { vibrato: 18, glisse: 60 });
    });
    E(ctx, G, 'radio', 'glock', t + 8 * jb, 84, 1.5, 0.6, { gain: 0.25, send: 0.2 });
    E(ctx, G, 'radio', 'glock', t + 8.5 * jb, 88, 1.5, 0.6, { gain: 0.22, send: 0.2 });
    /* Grésillement de la radio pendant tout le jingle */
    for (let x = 0; x < 10.8 * jb; x += L.rnd(0.03, 0.25)) {
      const b = L.sfxBuffer(ctx, 0.01, (d, sr) => { for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); });
      L.jouerSfx(ctx, G, 'radio', t + x, b, { gain: L.rnd(0.005, 0.03), pan: 0.15, send: 0 });
    }
    /* La coupure : le « Now? » s'étrangle. Tout descend (bande qui ralentit), un arc, un relais qui claque, le ronflement meurt */
    const tc = t + 10.8 * jb;                               // « Now? » a le temps de s'entendre, puis s'étrangle
    oscs.forEach((o) => { o.detune.setValueAtTime(0, tc); o.detune.linearRampToValueAtTime(-2400, tc + 0.8); });
    sortie.gain.setValueAtTime(0.2, tc); sortie.gain.linearRampToValueAtTime(0, tc + 0.8);
    L.arcElectrique(ctx, G, 'radio', tc - 0.05, { gain: 0.05, pan: 0.1 });
    L.relais(ctx, G, 'radio', tc + 0.75, { gain: 0.09, pan: -0.1 });
    /* Le ronflement secteur de la radio (la, 55 Hz) : présent sous le jingle, il grossit à la coupure puis s'éteint en descendant */
    const hum = ctx.createOscillator(); hum.type = 'sawtooth'; hum.frequency.value = 55;
    const hl = ctx.createBiquadFilter(); hl.type = 'lowpass'; hl.frequency.value = 320;
    const hg = L.voiceOut(ctx, G, 'radio', 0, 0.1); hum.connect(hl); hl.connect(hg);
    hg.gain.setValueAtTime(0.006, t); hg.gain.setValueAtTime(0.006, tc - 0.3); hg.gain.linearRampToValueAtTime(0.05, tc); hg.gain.linearRampToValueAtTime(0, tc + 1.6);
    hum.detune.setValueAtTime(0, tc); hum.detune.linearRampToValueAtTime(-1200, tc + 1.6);
    hum.start(t); hum.stop(tc + 1.7);
    L.ticMetal(ctx, G, 'radio', tc + 1.6, { gain: 0.012, pan: 0.6 });          // le métal de la radio qui refroidit, dans le silence
  }

  /* =================== Le thème =================== */

  /* Accords : [mesure de début, durée en mesures, notes (MIDI), fondamentale grave] */
  const ACCORDS = [
    // 🔥 Charbonniers — ré dorien
    [12, 2, [62, 64, 65, 69], 38], [14, 2, [62, 67, 71, 74], 38], [16, 2, [60, 64, 67, 72], 38], [18, 2, [60, 64, 65, 69], 38],
    // ⚡ Voltaïques — si mineur harmonique
    [20, 2, [54, 59, 62, 70], 35], [22, 2, [55, 59, 62, 66], 43], [24, 2, [52, 55, 59, 66], 40], [26, 2, [54, 58, 61, 67], 42],
    // ⚙️ Mécanistes — ré mixolydien
    [28, 2, [57, 62, 64, 66], 38], [30, 2, [55, 60, 64, 67], 38], [32, 2, [55, 59, 62, 67], 35], [34, 2, [57, 62, 64, 69], 33],
    // Les trois ensemble — ré lydien
    [36, 2, [61, 64, 66, 69], 38], [38, 2, [59, 64, 68, 71], 38], [40, 2, [57, 62, 64, 66], 35], [42, 2, [59, 61, 66, 71], 31],
    // Queue bouclable — ré lydien
    [44, 2, [57, 61, 64, 68], 38], [46, 2, [56, 59, 64, 66], 38], [48, 2, [57, 61, 64, 68], 38], [50, 2, [56, 59, 64, 66], 38]
  ];
  /* Mélodies : [mesure, temps, note, durée en temps]. Le motif : 5 1 3 5 6 5, puis la question 5 → 1 */
  const MOTIF = (m0, deg, inst, o) => ({ m0, inst, o, notes: deg });
  const MELODIES = [
    /* Le violon (2026-10-14, il « perçait » et sonnait « MIDI ») : toujours la prise douce, l'aigu adouci et un creux vers 2,9 kHz ;
       jeu LIÉ (notes qui se chevauchent, sans réattaque d'archet, petit glissé sur les intervalles courts), courbe de phrase,
       attaques légèrement humaines ; doublé très bas par les violons d'ensemble, qui l'arrondissent */
    MOTIF(14, [[0, 57, 2], [2, 62, 2], [4, 65, 2], [6, 69, 2], [8, 71, 3], [11, 69, 5], [16, 69, 2], [18, 74, 6]], 'violonSolo', { gain: 0.55, vel: 0.4, nuance: 0.2, attack: 0.3, release: 1.4, lp: 3800, presence: -5, lie: true, double: [['violons', 0, 0.4]] }),
    MOTIF(22, [[0, 78, 1], [1, 83, 1], [2, 86, 1], [3, 90, 1], [4, 91, 1.5], [5.5, 90, 2.5], [8, 90, 2], [10, 95, 6], [16, 94, 8]], 'glock', { gain: 0.16, vel: 0.5, echo: 0.45, send: 0.5 }),
    MOTIF(30, [[0, 69, 2], [2, 74, 2], [4, 78, 2], [6, 81, 2], [8, 83, 3], [11, 81, 5], [16, 81, 2], [18, 86, 6]], 'flute', { gain: 0.5, vel: 0.4, attack: 0.15, release: 1.2, presence: -3, lie: true }),
    /* Le sommet : le violon une octave plus bas qu'avant (la4 – ré5 au lieu de la5 – ré6), doublé à l'octave grave par le violoncelle ;
       la flûte prend la place qu'avait le violon (elle montait jusqu'au ré7 : c'est elle et le violon aigu qui faisaient mal) */
    MOTIF(36, [[0, 57, 2], [2, 62, 2], [4, 66, 2], [6, 69, 2], [8, 71, 3], [11, 69, 5], [16, 68, 2], [18, 69, 2], [20, 66, 4], [24, 69, 2], [26, 74, 6]], 'violonSolo', { gain: 0.6, vel: 0.45, nuance: 0.2, attack: 0.25, release: 1.5, lp: 3800, presence: -5, lie: true, double: [['violons', 0, 0.4], ['violoncelles', -12, 0.45]] }),
    MOTIF(36, [[0, 69, 2], [2, 74, 2], [4, 78, 2], [6, 81, 2], [8, 83, 3], [11, 81, 5], [16, 80, 2], [18, 81, 2], [20, 78, 4], [24, 81, 2], [26, 86, 6]], 'flute', { gain: 0.26, vel: 0.4, attack: 0.15, release: 1.2, lp: 5000, presence: -3, lie: true }),
    MOTIF(46, [[0, 57, 1.5], [1.5, 62, 1.5], [3, 66, 1.5], [4.5, 69, 1.5], [6, 71, 2], [8, 69, 6]], 'harpe', { gain: 0.4, vel: 0.5 })
  ];

  /* Sons trouvés : la grille 3+3+2 (croches 0, 3, 6) ; avant la mesure 12 ils sont épars, puis se calent */
  /* Les trois places de la grille : bois grave (tambour de bois), métal clair (triangle, cloche agogo), métal sourd (tambour de frein) */
  const TROUVES = [['logDrum', null], ['triangle', null], ['metalDivers', /^(brake_m|agogoBell2_mp|bell_tree_metalscrape)/]];
  const BOIS_CLAIR = /^(claves_(pp|mp)|slitdrum0_(ppp|mp))/;
  function sonsTrouves(ctx, G, b, t, L) {
    const p = Math.min(1, Math.max(0, (b - DEBUT) / 7));            // 0 : épars ; 1 : calés sur la grille
    let densite = b < 12 ? 0.35 + 0.65 * p : b < 20 ? 0.75 : b < 28 ? 0.45 : b < 36 ? 0.85 : b < 44 ? 1 : 0.3;
    if (b >= 44) densite = 0.3;
    [0, 3, 6].forEach((croche, i) => {
      if (Math.random() > densite) return;
      const jitter = (b < 12 ? Math.pow(1 - p, 2) * L.rnd(-1.4, 1.4) * TEMPS : 0) + (b >= 44 ? L.rnd(-0.5, 0.5) * TEMPS : 0);
      const tt = Math.max(t, t + croche * TEMPS / 2 + jitter), [inst, filtre] = TROUVES[i];
      const g = { logDrum: 0.3, triangle: 0.08, metalDivers: 0.1 }[inst] * (b >= 36 && b < 44 ? 1.2 : 1);
      E(ctx, G, 'rythmique', inst, tt, 0, 3, 1, { gain: g, pan: [-0.3, 0.4, 0.1][i], send: 0.35, filtre });
      /* Mécanistes et ensemble : un bois clair en contretemps */
      if (b >= 28 && b < 44 && i === 1 && Math.random() < 0.5) E(ctx, G, 'rythmique', 'boisDivers', tt + TEMPS / 2, 0, 1, 1, { gain: 0.12, pan: -0.4, send: 0.3, filtre: BOIS_CLAIR });
    });
    /* Quelques sons libres en plus, au début et dans la queue : la matière avant la musique */
    if (b < 10 || b >= 46) {
      const n = b < 10 ? 2 : 1;
      for (let k = 0; k < n; k++) {
        const nom = L.pick(['ticMetal', 'verreTinte', 'chaine', 'goutte', 'craquementBois']);
        L[nom](ctx, G, 'rythmique', t + L.rnd(0, MESURE), { gain: (nom === 'chaine' ? 0.02 : 0.018) });
      }
    }
  }

  const theme = {
    id: 'theme-principal', nom: 'Le réveil et le thème principal', bpm: BPM, bars: 52, debutTheme: DEBUT, boucle: [44, 52],
    instruments: ['violonSolo', 'violons', 'violoncelles', 'harpe', 'flute', 'glock', 'marimba', 'triangle', 'logDrum', 'metalDivers', 'boisDivers'],
    mix: { couches: ['radio', 'rythmique', 'basse', 'harmonie', 'melodie'], rt: [4.5, 3.6, 1.6], predelay: 0.025, verbWet: 0.5, delay: 3 * 60 / BPM / 2, delayFb: 0.35, tone: 11000, trim: {} },
    bar(ctx, G, b, t, L) {
      if (b === 0) reveil(ctx, G, t, L);
      if (b < DEBUT) return;
      sonsTrouves(ctx, G, b, t, L);

      /* Naissance : bourdon de ré, puis violoncelles, puis la graine du motif à la harpe */
      if (b === 6) L.souffleAccorde(ctx, G, 'harmonie', t, 38, 6 * MESURE, 1, { couleur: 'fond', gain: 0.035, attack: 6, release: 4 });
      if (b === 8) { [38, 45].forEach((m, i) => E(ctx, G, 'basse', 'violoncelles', t + i * 0.8, m, 4 * MESURE - 0.8 * i, 0.3, { gain: 0.45, attack: 3, release: 2.5, pan: i ? 0.2 : -0.2 })); }
      if (b === 10) [[0, 62], [1, 69], [2, 76]].forEach(([k, m]) => E(ctx, G, 'melodie', 'harpe', t + k * TEMPS, m, 3, 0.45, { gain: 0.4, send: 0.6, pan: -0.3 + k * 0.3 }));

      /* Accords */
      const ac = ACCORDS.find((a) => a[0] === b);
      if (ac) {
        const [b0, n, notes, rac] = ac, d = n * MESURE;
        const fort = b >= 36 && b < 44 ? 0.88 : b >= 44 ? 0.5 : 0.75;
        const famille = b < 20 ? 'charb' : b < 28 ? 'volt' : b < 36 ? 'meca' : 'tous';
        /* Les violons tiennent la nappe partout sauf chez les Voltaïques (où l'onde douce la remplace) */
        if (famille !== 'volt') notes.forEach((m, i) => E(ctx, G, 'harmonie', 'violons', t + i * 0.12, m, d + 0.3, 0.35 * fort, { gain: 0.32, attack: 1.2, release: 1.8, pan: -0.5 + i / 3 }));
        if (famille === 'volt' || famille === 'tous' || b >= 44) notes.forEach((m, i) => L.ondeDouce(ctx, G, 'harmonie', t + i * 0.2, m, d, 1, { gain: famille === 'volt' ? 0.05 : 0.022, attack: 1.5, release: 2.5, pan: -0.4 + i / 4, pulse: 84 / 60 * 2, depth: 0.15, grille: t, echo: 0.1 }));
        if (famille === 'charb' || b >= 44) notes.slice(-2).forEach((m, i) => L.souffleAccorde(ctx, G, 'harmonie', t, m, d, 1, { couleur: 'metal', gain: 0.02, attack: 2, release: 2.5, pan: i ? 0.5 : -0.5 }));
        if (famille === 'meca' || b >= 44) L.souffleAccorde(ctx, G, 'harmonie', t + 0.3, notes[0], d, 1, { couleur: 'flute', gain: 0.025, attack: 2, release: 2.5, pan: 0.3 });
        E(ctx, G, 'basse', 'violoncelles', t, rac + (rac < 36 ? 12 : 0), d + 0.4, 0.4 * fort, { gain: 0.5, attack: 0.8, release: 2 });
        L.sousBasse(ctx, G, 'basse', t, rac, d, 1, { gain: 0.08 * fort, attack: 1.5, release: 2 });
        /* Mécanistes et ensemble : harpe en croches montantes, marimba sur le 3+3+2 */
        if (famille === 'meca' || famille === 'tous') {
          for (let k = 0; k < n * 8; k++) if (Math.random() < (famille === 'tous' ? 0.7 : 0.55)) E(ctx, G, 'harmonie', 'harpe', t + k * TEMPS / 2, notes[k % notes.length] + (k % 8 >= 4 ? 12 : 0), 2, 0.4, { gain: 0.28, pan: L.rnd(-0.5, 0.5), send: 0.5 });
          for (let m = 0; m < n; m++) [0, 3, 6].forEach((c, i) => E(ctx, G, 'rythmique', 'marimba', t + m * MESURE + c * TEMPS / 2, notes[i] - 12, 1.5, 0.5, { gain: 0.22, pan: [-0.2, 0.3, 0][i], send: 0.3 }));
          if (famille === 'meca' && b % 4 === 2) L.carillonBambou(ctx, G, 'rythmique', t, d, notes, { gain: 0.02, gusts: 1 });
        }
        /* Voltaïques : verre et relais, discrets */
        if (famille === 'volt') { L.verreTinte(ctx, G, 'rythmique', t + L.rnd(0.5, d - 1), { gain: 0.018 }); if (b % 4 === 0) L.relais(ctx, G, 'rythmique', t + L.rnd(1, d - 1), { gain: 0.025 }); }
        /* Charbonniers : l'enclume, au loin, au début de chaque accord */
        if (famille === 'charb') L.chocLointain(ctx, G, 'rythmique', t, { gain: 0.04, lp: 1100 });
      }

      /* Mélodies */
      MELODIES.forEach((mel) => {
        const n = mel.notes.length;
        mel.notes.forEach(([beat, m, dur], i) => {
          const tb = mel.m0 * 4 + beat;                     // en temps depuis la mesure 0
          if (Math.floor(tb / 4) !== b) return;
          const o = Object.assign({ send: 0.45 }, mel.o);
          let tt = t + (tb - b * 4) * TEMPS, d = dur * TEMPS;
          if (mel.o.lie) {
            /* Jeu lié : la note déborde sur la suivante (pas de trou, pas de réattaque) ; si elle suit la précédente sans silence,
               elle entre sans l'attaque de l'archet (on saute le début de l'échantillon) et glisse depuis elle si l'intervalle est court */
            const prev = mel.notes[i - 1], suite = prev && Math.abs(prev[0] + prev[2] - beat) < 1e-6;
            d += 0.2;
            if (suite) Object.assign(o, { attack: 0.1, offset: 0.08, glisseDe: Math.abs(prev[1] - m) <= 5 ? prev[1] : undefined, glisse: 0.06 });
            o.gain = mel.o.gain * (0.82 + 0.3 * Math.sin(Math.PI * i / Math.max(1, n - 1)));      // la phrase enfle puis retombe
            tt += L.rnd(-0.012, 0.012);                                                          // une attaque humaine, pas une grille
          }
          /* La voix du violon peut être remplacée (theme.voixMelodie) : 'violon' (échantillon retravaillé), 'violoncelle'
             (le pupitre, une octave plus bas), 'souffle' (le souffle accordé « violon à reflets de métal » des Charbonniers) */
          const voix = mel.inst === 'violonSolo' ? (theme.voixMelodie || 'violon') : null;
          if (voix === 'violoncelle') {
            E(ctx, G, 'melodie', 'violoncelles', tt, m - 12, d, 0.4, Object.assign({}, o, { gain: o.gain * 1.25, nuance: 0.3, attack: Math.max(o.attack, 0.18), glisseDe: o.glisseDe != null ? o.glisseDe - 12 : undefined, lp: 3000, presence: 0 }));
            return;
          }
          if (voix === 'souffle') {
            L.souffleAccorde(ctx, G, 'melodie', tt, m, d, 1, { couleur: 'metal', gain: 0.05 * o.gain / mel.o.gain * (m > 70 ? 0.8 : 1), attack: o.offset ? 0.09 : 0.2, release: 0.9, pan: 0.1, send: 0.6, flutter: 0.25 });
            L.souffleAccorde(ctx, G, 'melodie', tt + 0.03, m - 12, d, 1, { couleur: 'bois', gain: 0.018 * o.gain / mel.o.gain, attack: 0.25, release: 0.9, pan: -0.2, send: 0.5 });   // l'octave grave, en bois : le corps
            return;
          }
          E(ctx, G, 'melodie', mel.inst, tt, m, d, mel.o.vel, o);
          (mel.o.double || []).forEach(([inst, tr, part]) => E(ctx, G, 'melodie', inst, tt, m + tr, d, mel.o.vel, Object.assign({}, o, {
            gain: o.gain * part, attack: Math.max(o.attack, 0.2), glisseDe: o.glisseDe != null ? o.glisseDe + tr : undefined, pan: -0.2 })));
        });
      });
    }
  };

  /* La voix du violon : 'violoncelle' choisi par le porteur le 2026-10-14 (comparaison : theme-principal/comparer.html) */
  theme.voixMelodie = 'violoncelle';
  /* L'orgue de pub et la voix du crooner, réutilisés par la radio de la Compagnie (coopérative, cooperative/pieces.js) */
  theme.radio = { orgue, voix };
  window.WattThemePrincipal = theme;
})();
