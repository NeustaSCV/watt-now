/* Watt Now? — pièces provisoires pour le moteur de couches, rendues depuis les esquisses.
   Chaque pièce : blocs de 8 mesures à 84 BPM (≈ 22,9 s) + 1 mesure de queue, un AudioBuffer par stem.
   En production, ces tampons seront remplacés par les fichiers des stems (Opus ou AAC) ; le moteur ne change pas.

   Fond jour (2 blocs) · Fond nuit (2 blocs) · Vie de jour (2 blocs, 5 stems dont « outil ») · Vie de nuit (4 blocs, 3 stems)
   Tension (2 blocs : pulsation, texture) · Danger (1 bloc : percussions, basse, stridences)
   Signaux (12) : crépuscule, aube, saisie, dégagement, endormissement, feu (premier feu), premier Éteint repéré, recette réussie,
   découverte d'une recette, arrivée au Comptoir, échange conclu, mort.
   Dépend de esquisses/js/moteur.js et themes.js (window.WattMusique, window.WattThemes). */
(function () {
  'use strict';
  const W = window.WattMusique, L = W.lib, rnd = L.rnd, mtof = L.mtof;
  const BPM = 84, TEMPS = 60 / BPM, BAR = 4 * TEMPS, BLOC = 8, DUREE = BLOC * BAR;

  /* Fondu de sortie sur la fin de la queue, pour qu'aucun bloc ne s'arrête net */
  function fonduFin(buf, sec) {
    const n = Math.floor(sec * buf.sampleRate);
    for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c), L0 = d.length; for (let i = 0; i < n; i++) d[L0 - n + i] *= 1 - i / n; }
    return buf;
  }
  /* Rendu d'un stem : graphe complet (réverbération comprise), seules les voix de cette couche sont calculées */
  async function rendreStem(mix, couche, fn, sr, mesures, dureeMesure) {
    const sec = ((mesures || BLOC) + 1) * (dureeMesure || BAR);
    const ctx = new OfflineAudioContext(2, Math.ceil(sr * sec), sr);
    const G = L.buildGraph(ctx, Object.assign({}, mix, { seule: couche }));
    fn(ctx, G);
    return fonduFin(await ctx.startRendering(), 0.6);
  }

  /* ---------- Fond (commun au terrain) ---------- */
  const MIX_FOND = { rt: [5, 4, 1.8], predelay: 0.03, verbWet: 0.5, tone: 8000, trim: {} };
  function blocFond(bi, nuit) {
    return (ctx, G) => {
      L.vent(ctx, G, 'fond', 0.02, DUREE - 0.5, 1, { gain: nuit ? 0.014 : 0.016, center: nuit ? 260 : 380 });
      L.souffleAccorde(ctx, G, 'fond', 0.02, nuit ? 26 : 38, DUREE - 2, 1, { couleur: 'fond', gain: nuit ? 0.035 : 0.03, attack: 2.5, release: 3.5, pan: -0.15 });
      if (bi === 1) L.souffleAccorde(ctx, G, 'fond', 1.5, 45, DUREE - 4, 1, { couleur: 'fond', gain: 0.018, attack: 4, release: 3, pan: 0.25 });
      if (nuit) grillonsAccordes(ctx, G, 'fond', 0.5, DUREE - 1, bi);
    };
  }
  /* Grillons accordés (Fond nuit) : stridulations sur ré et la aigus, en rafales irrégulières */
  function grillonsAccordes(ctx, G, couche, t, dur, bi) {
    const notes = bi ? [93, 98] : [98, 105];
    let x = rnd(0.5, 2);
    while (x < dur) {
      const f = mtof(L.pick(notes)), n = 3 + Math.floor(Math.random() * 4), pan = rnd(-0.8, 0.8);
      const buf = L.sfxBuffer(ctx, n * 0.045 + 0.1, (d, sr) => { for (let k = 0; k < n; k++) L.ping(d, sr, k * 0.045, f, 1, 0.012); });
      L.jouerSfx(ctx, G, couche, t + x, buf, { gain: 0.006, pan, send: 0.7 });
      x += rnd(0.8, 3.5);
    }
  }

  /* ---------- Vie (famille) : deux blocs de deux accords de 4 mesures ---------- */
  /* Blocs 3 à 6 de la Vie de jour (production) : [fondamentale, notes, mesures]. Mêmes modes que l'esquisse validée. */
  const SUITE_JOUR = {
    charbonniers: [
      [[38, [50, 57, 64, 65], 4], [40, [52, 55, 59, 62], 4]],             // ré m9 · mi m7 : le si♮ dorien
      [[41, [53, 57, 60, 64], 4], [38, [50, 55, 60, 64], 4]],             // fa maj7 · do / ré
      [[34, [53, 57, 62, 65], 4], [31, [53, 58, 62, 69], 2], [33, [55, 58, 61, 64], 2]],   // si♭ maj7 · sol m9 · la 7♭9 (mineur harmonique)
      [[38, [50, 57, 62, 64], 4], [38, [50, 59, 62, 67], 4]]              // ré m(add9) · sol / ré : retour du si♮
    ],
    voltaiques: [
      [[38, [54, 57, 61, 68], 4], [35, [54, 57, 61, 66], 4]],             // ré maj7♯11 · si m11
      [[43, [54, 59, 62, 66], 4], [38, [50, 56, 59, 64], 4]],             // sol maj7 · mi / ré (le sol♯)
      [[35, [54, 59, 62, 70], 4], [40, [55, 59, 62, 66], 4]],             // si m(maj7) · mi m9
      [[42, [54, 58, 61, 67], 4], [38, [54, 57, 61, 64], 4]]              // fa♯ 7♭9 · ré maj9
    ],
    mecanistes: [
      [[38, [50, 57, 64], 4], [38, [55, 59, 62], 4]],                     // ré sus2 · sol / ré
      [[33, [57, 60, 64], 4], [38, [55, 60, 64], 4]],                     // la m7 · do / ré
      [[31, [55, 58, 62], 4], [34, [53, 57, 60], 4]],                     // sol m · si♭ maj9 (l'emprunt doux)
      [[38, [54, 57, 62], 4], [38, [54, 57, 64], 4]]                      // ré · ré add9
    ]
  };
  function sequenceVie(def, bi) {
    const A = def.accords, deplier = (e, bars) => e.suite ? e.suite.map((c) => [c, bars / e.suite.length]) : [[e, bars]];
    if (bi === 0) return deplier(A[0], 4).concat(deplier(A[1], 4));
    if (bi === 1) return deplier(A[2], 4).concat(deplier(A[3], 4));
    return SUITE_JOUR[def.id][bi - 2].map(([r, v, bars]) => [{ r, v }, bars]);
  }
  function blocVie(def, bi) {
    return (ctx, G) => {
      let pos = 0;
      const seq = sequenceVie(def, bi);
      seq.forEach(([ch, bars], j) => {
        const t0 = 0.02 + pos * BAR, der = j === seq.length - 1;
        /* Chaque accord se fond dans le suivant ; le dernier s'éteint dans la queue, et le premier du bloc suivant entre par-dessus */
        const d = bars * BAR + (der ? -2 : 1.5), att = 2.5, rel = der ? 3.5 : 3, n = ch.v.length;
        ch.v.forEach((m, i) => L[def.voix || 'souffleAccorde'](ctx, G, 'harmonie', t0 + i * 0.3, m, d, 1,
          Object.assign({ couleur: def.couleur, gain: def.gainNappe, attack: att, release: rel, pan: -0.5 + i / Math.max(1, n - 1) }, def.voixOpts, { grille: t0 })));
        if (def.ombre) def.ombre(ctx, G, t0, ch, d, att, L);
        L.sousBasse(ctx, G, 'basse', t0 + 0.3, ch.r, d, 1, { gain: 0.12, attack: att + 0.5, release: rel });
        pos += bars;
      });
      def.lit(ctx, G, 0.02, DUREE - 0.5, L);
      /* Effets : ceux de la première ou de la seconde moitié de l'esquisse ; décalés d'une mesure dans les blocs 3 à 6 */
      const moitie = bi % 2, decale = bi >= 2 ? 1 + (bi % 3) : 0;
      Object.entries(def.effets).forEach(([b, liste]) => {
        const k = (+b - moitie * 8 + decale) % 8;
        if (+b - moitie * 8 < 0 || +b - moitie * 8 >= 8) return;
        liste.forEach(([frac, nom, o]) => L[nom](ctx, G, 'effets', Math.max(0.05, (k + frac) * BAR + rnd(-0.25, 0.25)), o));
      });
    };
  }



  /* ---------- Percussion de l'atelier (stem « outil ») : le thème de famille au complet (moment-vitrine 4) ----------
     Les sons mêmes de l'atelier (outils-famille.js), accordés sur ré, la, mi et posés sur la grille 3+3+2 (croches 0, 3, 6). */
  /* Niveau du stem « outil » (mesuré) : présent, mais sous les nappes (≈ −25 dB RMS, crêtes ≈ −8 dB) */
  const NIVEAU_OUTIL = { charbonniers: 0.32, mecanistes: 0.45, voltaiques: 0.45 };
  function blocOutil(familleId, bi) {
    const O = window.WattOutils, X = TEMPS / 2;
    return (ctx, G) => {
      const jouer = (t, buf, gain, pan) => L.jouerSfx(ctx, G, 'outil', 0.02 + t, buf, { gain, pan: pan || 0, send: 0.35 });
      const variantes = (f, n) => Array.from({ length: n }, f);
      if (familleId === 'charbonniers') {        // la fanfare de la forge : marteau lourd, rebonds sur l'enclume, soufflet
        const lourd = variantes(() => O.enclume(ctx, 74, 1), 3), leger = variantes(() => O.enclume(ctx, 81, 0.5), 3), mi = variantes(() => O.enclume(ctx, 76, 0.35), 2), souf = O.soufflet(ctx);
        for (let m = 0; m < BLOC; m++) {
          const t = m * BAR;
          jouer(t, L.pick(lourd), 0.5, -0.1);
          jouer(t + 3 * X, L.pick(leger), 0.3, 0.2);
          jouer(t + 6 * X, L.pick(leger), 0.27, 0.25);
          if (bi % 2 === 1 && m % 2 === 1) jouer(t + 5 * X, L.pick(mi), 0.14, -0.3);
          if (m === 3 || m === 7) jouer(t + 7 * X, L.pick(mi), 0.15, 0.3);
          if (m % 4 === 0) jouer(t, souf, 0.22, -0.5);
        }
      } else if (familleId === 'mecanistes') {   // la chaîne du pédalier en doubles croches (accents 3+3+2), les rayons pincés accordés
        const maillon = variantes(() => O.chaine(ctx, 0.01, 1, 1), 4), ray = { 0: O.rayon(ctx, 74, 0.8), 3: O.rayon(ctx, 81, 0.7), 6: O.rayon(ctx, 76, 0.7) }, roue = O.roueLibre(ctx);
        for (let m = 0; m < BLOC; m++) {
          const t = m * BAR;
          for (let k = 0; k < 16; k++) jouer(t + k * X / 2, L.pick(maillon), [0, 3, 6, 8, 11, 14].includes(k) ? 0.16 : 0.07, 0.3);
          [0, 3, 6].forEach((c) => jouer(t + c * X, ray[c], c === 0 ? 0.3 : 0.24, c === 0 ? -0.2 : 0.2));
        }
        jouer(7 * BAR + 4 * X, roue, 0.18, 0.4);
      } else {                                   // le banc de recharge : bornes frappées accordées, pinces, interrupteur
        const bornes = { 0: O.borne(ctx, 50, 1), 3: O.borne(ctx, 57, 0.8), 6: O.borne(ctx, 52, 0.8) }, pin = variantes(() => O.pince(ctx), 3), inter = O.interrupteur(ctx);
        for (let m = 0; m < BLOC; m++) {
          const t = m * BAR;
          [0, 3, 6].forEach((c) => jouer(t + c * X, bornes[c], c === 0 ? 0.45 : 0.3, c === 0 ? 0 : (c === 3 ? -0.3 : 0.3)));
          jouer(t + 7 * X, L.pick(pin), 0.12, 0.4);
          if (bi % 2 === 1) jouer(t + 2 * X, L.pick(pin), 0.08, -0.4);
          if (m % 2 === 1) jouer(t + 4 * X, inter, 0.14, -0.2);
        }
      }
    };
  }

  /* ---------- Vie de nuit : 4 blocs, 3 stems (basse, harmonie, mélodie) ----------
     Même famille, moitié moins d'instruments, pas de batterie ni d'effets ; le mode de la deuxième partie
     (proposition 6) ; une mélodie rare, jouée très doucement par l'instrument de la famille.
     Chaque bloc : deux accords de 4 mesures, à 3 notes. Mélodie : [temps dans le bloc, note, durée en temps]. */
  const NUIT = {
    charbonniers: {          // ré éolien, et le do♯ du mineur harmonique
      accords: [[[38, [50, 57, 64]], [34, [53, 57, 62]]], [[31, [53, 58, 62]], [33, [55, 58, 61]]], [[38, [50, 57, 65]], [41, [52, 57, 60]]], [[31, [55, 58, 62]], [33, [52, 57, 61]]]],
      /* 2026-10-14 : le violon solo « perçait » et sonnait « MIDI » ; ce sont maintenant les violoncelles, une octave plus bas, en jeu lié */
      melodie: { inst: 'violoncelles', transpo: -12, lie: true, o: { gain: 1.6, vel: 0.35, nuance: 0.3, attack: 0.5, release: 2, lp: 3000, send: 0.6 },
        phrases: [[[8, 57, 4], [12, 62, 4], [16, 65, 8]], [[12, 70, 4], [16, 69, 10]], [], [[4, 69, 3], [7, 65, 3], [10, 64, 4], [14, 61, 8]]] }
    },
    voltaiques: {            // si mineur harmonique
      accords: [[[35, [54, 59, 62]], [43, [54, 59, 62]]], [[40, [55, 59, 62]], [42, [54, 58, 61]]], [[35, [50, 54, 59]], [38, [54, 57, 61]]], [[43, [54, 59, 64]], [42, [54, 58, 64]]]],
      melodie: { synth: true, phrases: [[[6, 78, 4], [14, 83, 6]], [[10, 82, 8]], [], [[4, 86, 3], [8, 85, 3], [12, 83, 8]]] }
    },
    mecanistes: {            // emprunt doux à sol mineur harmonique : consonant
      accords: [[[38, [50, 57, 64]], [31, [55, 58, 62]]], [[34, [53, 57, 60]], [38, [54, 57, 62]]], [[36, [55, 60, 63]], [34, [53, 58, 62]]], [[31, [55, 58, 62]], [38, [54, 57, 62]]]],
      melodie: { inst: 'fluteNV', o: { gain: 1.8, vel: 0.2, attack: 0.4, release: 1.8, lp: 4000, send: 0.55 },
        phrases: [[[8, 69, 4], [12, 74, 4], [16, 70, 8]], [[4, 72, 4], [8, 69, 4], [16, 66, 8]], [], [[8, 67, 4], [12, 70, 4], [16, 69, 10]]] }
    }
  };
  function blocVieNuit(def, nuit, bi) {
    return (ctx, G) => {
      nuit.accords[bi].forEach(([r, v], j) => {
        const t0 = 0.02 + j * 4 * BAR, der = j === 1, d = 4 * BAR + (der ? -2 : 1.5);
        v.forEach((m, i) => L[def.voix || 'souffleAccorde'](ctx, G, 'harmonie', t0 + i * 0.6, m, d, 1,
          Object.assign({ couleur: def.couleur, gain: def.gainNappe * 0.75, attack: 3.5, release: der ? 3.5 : 3, pan: -0.4 + i * 0.4 }, def.voixOpts, { grille: t0, depth: 0.08 })));
        L.sousBasse(ctx, G, 'basse', t0 + 0.4, r, d, 1, { gain: 0.1, attack: 3, release: 3 });
      });
      const mel = nuit.melodie;
      const ph = mel.phrases[bi], tr = mel.transpo || 0, pan = L.rnd(-0.25, 0.25);
      ph.forEach(([beat, m, dur], i) => {
        let t = 0.02 + beat * TEMPS, d = dur * TEMPS;
        if (mel.synth) { L.ondeDouce(ctx, G, 'melodie', t, m, d, 1, { gain: 0.05, attack: 0.6, release: 2.5, echo: 0.35, send: 0.6, cutoff: 2200, pan: L.rnd(-0.3, 0.3) }); return; }
        const o = Object.assign({ pan }, mel.o);
        if (mel.lie) {
          /* Jeu lié : chevauchement, pas de réattaque d'archet, petit glissé sur les intervalles courts, attaques humaines */
          const prev = ph[i - 1], suite = prev && Math.abs(prev[0] + prev[2] - beat) < 1e-6;
          d += 0.25; t += L.rnd(-0.012, 0.012);
          if (suite) Object.assign(o, { attack: 0.15, offset: 0.08, glisseDe: Math.abs(prev[1] - m) <= 5 ? prev[1] + tr : undefined, glisse: 0.07 });
        }
        window.WattEchantillons.jouer(ctx, G, 'melodie', mel.inst, t, m + tr, d, mel.o.vel, o);
      });
    };
  }

  /* ---------- Tension : pulsation 3 contre 4 qui se resserre, bois frappé (col legno), souffle ; tonique ré ---------- */
  const MIX_TENSION = { rt: [3.5, 2.8, 1.4], predelay: 0.02, verbWet: 0.4, tone: 7000, trim: {} };
  function battement(ctx) {
    return L.sfxBuffer(ctx, 0.6, (d, sr) => {
      let ph = 0;
      for (let i = 0; i < 0.5 * sr; i++) { const s = i / sr, f = 42 + 26 * Math.exp(-s / 0.04); ph += 2 * Math.PI * f / sr; d[i] = Math.sin(ph) * Math.exp(-s / 0.14) * Math.min(1, s / 0.004); }
      let lp = 0; for (let i = 0; i < 0.03 * sr; i++) { lp += 0.08 * ((Math.random() * 2 - 1) - lp); d[i] += lp * 1.5 * (1 - i / (0.03 * sr)); }
    });
  }
  function colLegno(ctx, midi) {
    const f = mtof(midi);
    return L.sfxBuffer(ctx, 0.5, (d, sr, Ln) => {
      const x = new Float32Array(Ln); for (let i = 0; i < 0.0012 * sr; i++) x[i] = Math.random() * 2 - 1;
      L.resonner(x, d, sr, [[f, 1, 0.05], [f * 2.01, 0.5, 0.03], [f * 3.02, 0.3, 0.02], [rnd(1800, 2400), 0.4, 0.008]]);
    });
  }
  /* tr : transposition en demi-tons (halte : +7, la tonique la) */
  function blocTension(bi, tr) {
    tr = tr || 0;
    return {
      pulsation: (ctx, G) => {
        const b = battement(ctx), cl = [colLegno(ctx, 62 + tr), colLegno(ctx, 69 + tr), colLegno(ctx, 64 + tr)];
        /* Mesures 1-4 : 3 battements par mesure (3 contre 4) ; 5-6 : 4 par mesure ; 7-8 : 6 par mesure (ça se resserre) */
        for (let m = 0; m < BLOC; m++) {
          const n = bi === 0 ? (m < 4 ? 3 : m < 6 ? 4 : 6) : (m < 2 ? 4 : 6);
          for (let k = 0; k < n; k++) L.jouerSfx(ctx, G, 'rythmique', 0.02 + m * BAR + k * BAR / n, b, { gain: 0.32 * (k === 0 ? 1 : 0.75), send: 0.15, lp: 900 });
          /* Bois frappé en croches groupées 3+3+2, contre la pulsation */
          if (m >= (bi === 0 ? 2 : 0)) [0, 3, 6].forEach((c, i) => L.jouerSfx(ctx, G, 'rythmique', 0.02 + m * BAR + c * TEMPS / 2, cl[i], { gain: 0.05 + 0.02 * (m / BLOC), pan: [-0.4, 0.3, 0.1][i], send: 0.35 }));
        }
      },
      texture: (ctx, G) => {
        L.souffleAccorde(ctx, G, 'harmonie', 0.02, 38 + (tr ? tr - 12 : 0), DUREE - 1.5, 1, { couleur: tr ? 'cuve' : 'fond', gain: 0.05, attack: 1.5, release: 3, pan: -0.2 });
        L.souffleAccorde(ctx, G, 'harmonie', 0.5, 45 + (tr ? tr - 12 : 0), DUREE - 2, 1, { couleur: 'fond', gain: 0.03, attack: 3, release: 3, pan: 0.2 });
        L.souffleAccorde(ctx, G, 'harmonie', 4 * BAR, (bi ? 64 : 62) + tr, 4 * BAR - 1.5, 1, { couleur: 'metal', gain: 0.02, attack: 4, release: 3, pan: 0.4 });
        L.vent(ctx, G, 'harmonie', 0.02, DUREE - 0.5, 1, { gain: 0.03, center: 900 });
      }
    };
  }

  /* ---------- Danger : tôle frappée, basse saturée, stridences ; la peur vient du rythme (3+3+2) et de la matière ---------- */
  const MIX_DANGER = { rt: [2.4, 2, 1.1], predelay: 0.01, verbWet: 0.3, tone: 10000, trim: {} };
  function tole(ctx, grave) {
    const f0 = grave ? rnd(95, 120) : rnd(150, 190);
    return L.sfxBuffer(ctx, 1.6, (d, sr, Ln) => {
      const x = new Float32Array(Ln); for (let i = 0; i < 0.004 * sr; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / (0.004 * sr));
      L.resonner(x, d, sr, [[f0, 1, 0.45], [f0 * 1.58, 0.8, 0.35], [f0 * 2.33, 0.7, 0.25], [f0 * 3.1, 0.5, 0.18], [f0 * 4.4, 0.4, 0.12], [f0 * 5.9, 0.3, 0.08], [f0 * 8.2, 0.2, 0.05]]);
      let lp = 0; for (let i = 0; i < 0.05 * sr; i++) { lp += 0.06 * ((Math.random() * 2 - 1) - lp); d[i] += lp * 8 * (1 - i / (0.05 * sr)); }
    });
  }
  function basseSaturee(ctx, G, t, midi, dur, vel) {
    const amp = L.voiceOut(ctx, G, 'basse', 0, 0.05);
    const ws = ctx.createWaveShaper(), cv = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = (i / 1023) * 2 - 1; cv[i] = Math.tanh(4 * x); }
    ws.curve = cv;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 650; lp.Q.value = 1.2;
    const a = ctx.createOscillator(); a.type = 'sawtooth'; a.frequency.value = mtof(midi);
    const b = ctx.createOscillator(); b.type = 'square'; b.frequency.value = mtof(midi) / 2; const bg = ctx.createGain(); bg.gain.value = 0.5;
    a.connect(ws); b.connect(bg); bg.connect(ws); ws.connect(lp); lp.connect(amp);
    amp.gain.setValueAtTime(0, t); amp.gain.linearRampToValueAtTime(0.09 * vel, t + 0.01); amp.gain.setTargetAtTime(0.05 * vel, t + 0.02, 0.1); amp.gain.setTargetAtTime(0, t + dur, 0.06);
    [a, b].forEach((o) => { o.start(t); o.stop(t + dur + 0.5); });
  }
  const DANGER_BASSE = [[38, 0], [38, 3], [36, 6]];   // ré, ré, do : croches 3+3+2
  function blocDanger(bi, tr) {
    bi = bi || 0; tr = tr || 0;                     // halte : −5 (la grave)
    return {
      percussions: (ctx, G) => {
        const t1 = tole(ctx, false), t2 = tole(ctx, true), t3 = tole(ctx, false);
        for (let m = 0; m < BLOC; m++) {
          [0, 3, 6].forEach((c, i) => L.jouerSfx(ctx, G, 'rythmique', 0.02 + m * BAR + c * TEMPS / 2, i === 0 ? t2 : (i === 1 ? t1 : t3), { gain: i === 0 ? 0.45 : 0.3, pan: [0, -0.35, 0.35][i], send: 0.25 }));
          if (m % 2 === 1 || bi === 1) [2, 5].forEach((c) => L.jouerSfx(ctx, G, 'rythmique', 0.02 + m * BAR + c * TEMPS / 2, t1, { gain: bi === 1 ? 0.2 : 0.16, pan: rnd(-0.6, 0.6), send: 0.25, lp: 3000 }));
          if (bi === 1 && m >= 4) [1, 4, 7].forEach((c) => L.jouerSfx(ctx, G, 'rythmique', 0.02 + m * BAR + c * TEMPS / 2, t3, { gain: 0.1, pan: rnd(-0.7, 0.7), send: 0.2, lp: 2200 }));   // ça se resserre
        }
      },
      basse: (ctx, G) => {
        /* Bloc 2 : la basse monte d'un ton (mi) au milieu, puis retombe sur ré : la peur qui ne se résout pas */
        for (let m = 0; m < BLOC; m++) DANGER_BASSE.forEach(([n, c]) => basseSaturee(ctx, G, 0.02 + m * BAR + c * TEMPS / 2, tr + (bi === 1 && m >= 2 && m < 6 ? n + 2 : (m >= 6 && c === 6 ? 33 : n)), TEMPS * 1.2, c === 0 ? 1 : 0.8));
      },
      stridences: (ctx, G) => {
        [1, 3, 5, 7].forEach((m) => L.grincementMetal(ctx, G, 'harmonie', 0.02 + (m + rnd(0.1, 0.6)) * BAR, { gain: 0.07 }));
        L.vent(ctx, G, 'harmonie', 0.02, DUREE - 0.5, 1, { gain: 0.05, center: 2400 });
      }
    };
  }


  /* ======================= LA HALTE (la station-service) — la mineur harmonique =======================
     Tonique la (quinte de ré). Fond : la cuve, l'auvent, le néon mort. Exploration : le compteur de la pompe en 3+3+2,
     bidons et tuyau, guitare préparée, la cuve en nappe. Tension et Danger : ceux du terrain, transposés en la. */
  const MIX_HALTE = { rt: [3.2, 2.6, 1.3], predelay: 0.03, verbWet: 0.45, tone: 8500, trim: {}, couches: ['fond', 'pulsation', 'basse', 'texture'] };
  function blocFondHalte(bi) {
    return {
      nappe: (ctx, G) => {
        L.souffleAccorde(ctx, G, 'fond', 0.02, 33, DUREE - 2, 1, { couleur: 'cuve', gain: 0.045, attack: 3, release: 3.5, pan: -0.1 });
        L.souffleAccorde(ctx, G, 'fond', 1.2, 40, DUREE - 3.5, 1, { couleur: 'cuve', gain: 0.025, attack: 4, release: 3, pan: 0.25 });
        if (bi === 1) L.souffleAccorde(ctx, G, 'fond', 4 * BAR, 80, 3 * BAR, 1, { couleur: 'verre', gain: 0.008, attack: 4, release: 3, pan: 0.5 });   // un sol♯ fantôme, très haut
      },
      texture: (ctx, G) => {
        const H = window.WattHalte;
        L.jouerSfx(ctx, G, 'texture', 0.02, H.auvent(ctx, DUREE), { gain: 0.35, send: 0.3 });
        L.jouerSfx(ctx, G, 'texture', (bi ? 5.3 : 2.4) * BAR, H.neonMort(ctx), { gain: 0.1, pan: 0.5, send: 0.4 });
        L.grincementMetal(ctx, G, 'texture', (bi ? 2.2 : 6.1) * BAR, { gain: 0.03, pan: -0.5 });
      }
    };
  }
  /* Exploration : [fondamentale de la basse, accord de la texture] par moitié de bloc (4 mesures) */
  const EXPLO = [
    [[45, [57, 60, 64]], [41, [57, 60, 65]]],          // la m · fa / la
    [[40, [56, 59, 64]], [45, [57, 60, 64]]],          // mi (sol♯) · la m
    [[38, [57, 62, 65]], [40, [56, 62, 64]]],          // ré m / la · mi 7 (sol♯, ré)
    [[36, [56, 60, 64]], [45, [57, 60, 64]]]           // do augmenté (do mi sol♯ : la couleur du mineur harmonique) · la m
  ];
  function blocExplo(bi) {
    const H = window.WattHalte, X = TEMPS / 2;
    return {
      pulsation: (ctx, G) => {
        const clics = [0, 1, 2].map(() => H.compteurClic(ctx, 1)), doux = [0, 1].map(() => H.compteurClic(ctx, 0.4)), roule = H.compteurRoule(ctx);
        const bidons = { 0: H.bidon(ctx, 45, 1), 6: H.bidon(ctx, 40, 0.8) }, tuy = H.tuyau(ctx);
        for (let m = 0; m < BLOC; m++) {
          const t = 0.02 + m * BAR;
          for (let c = 0; c < 8; c++) {
            const accent = [0, 3, 6].includes(c);
            if (bi === 0 && !accent && c % 2) continue;            // bloc 1 : plus clairsemé
            L.jouerSfx(ctx, G, 'pulsation', t + c * X, accent ? L.pick(clics) : L.pick(doux), { gain: accent ? 0.22 : 0.1, pan: accent ? 0.15 : -0.15, send: 0.2 });
          }
          if (bi >= 1) [0, 6].forEach((c) => { if (c === 0 || m % 2) L.jouerSfx(ctx, G, 'pulsation', t + c * X, bidons[c], { gain: c ? 0.3 : 0.4, pan: c ? 0.3 : -0.2, send: 0.25 }); });
          if (m % 2 === 1) L.jouerSfx(ctx, G, 'pulsation', t + 7 * X, roule, { gain: bi === 3 ? 0.22 : 0.15, pan: 0.2, send: 0.2 });
          if (bi === 2 && m % 4 === 2) L.jouerSfx(ctx, G, 'pulsation', t + 4 * X, tuy, { gain: 0.25, pan: -0.4, send: 0.3 });
        }
      },
      basse: (ctx, G) => {
        EXPLO[bi].forEach(([r, ], j) => {
          const t0 = 0.02 + j * 4 * BAR;
          for (let m = 0; m < 4; m++) [0, 3, 6].forEach((c, k) => {           // la guitare préparée, grave, sur le 3+3+2
            if (k === 2 && m % 2 === 0) return;
            L.jouerSfx(ctx, G, 'basse', t0 + m * BAR + c * X, H.guitarePreparee(ctx, r, k ? 0.7 : 1, 0.5), { gain: k ? 0.3 : 0.4, send: 0.15 });
          });
          window.WattEchantillons.jouer(ctx, G, 'basse', 'trombone', t0 + 0.3, r, 4 * BAR - 1.2, 0.25, { gain: 0.22, attack: 1.5, release: 1.5, lp: 900, send: 0.3 });
          L.sousBasse(ctx, G, 'basse', t0, r - 12, 4 * BAR - 1, 1, { gain: 0.08, attack: 1.5, release: 2 });
        });
      },
      texture: (ctx, G) => {
        EXPLO[bi].forEach(([, v], j) => {
          const t0 = 0.02 + j * 4 * BAR, der = j === 1;
          v.forEach((m, i) => L.souffleAccorde(ctx, G, 'texture', t0 + i * 0.4, m, 4 * BAR + (der ? -2 : 1.5), 1, { couleur: 'cuve', gain: 0.022, attack: 2.5, release: der ? 3.5 : 3, pan: -0.4 + i * 0.4 }));
          /* Fragments de guitare préparée, aigus et rares : les notes de l'accord, et le sol♯ */
          const notes = v.map((n) => n + 12).concat(bi % 2 ? [80] : []);
          [[1, 0.5], [2, 2.75], [3, 1.5]].forEach(([m, beat], k) => { if ((bi + k) % 3 === 2) return; L.jouerSfx(ctx, G, 'texture', t0 + m * BAR + beat * TEMPS, H.guitarePreparee(ctx, notes[(k + bi) % notes.length], 0.6, 0.3), { gain: 0.16, pan: -0.3 + k * 0.3, send: 0.45 }); });
        });
        L.vent(ctx, G, 'texture', 0.02, DUREE - 0.5, 1, { gain: 0.012, center: 600 });
      }
    };
  }

  /** Les pièces de la halte (communes à toutes les familles) */
  async function preparerHalte(sr, progres) {
    const pieces = {
      'fond-halte': { stems: ['nappe', 'texture'], blocs: [{}, {}] },
      'explo-halte': { stems: ['pulsation', 'basse', 'texture'], blocs: [{}, {}, {}, {}] },
      'tension-halte': { stems: ['pulsation', 'texture'], blocs: [{}, {}] },
      'danger-halte': { stems: ['percussions', 'basse', 'stridences'], blocs: [{}, {}] }
    };
    const signaux = {}, taches = [];
    [0, 1].forEach((bi) => {
      const F = blocFondHalte(bi);
      taches.push(['Fond halte ' + (bi + 1) + ', nappe', async () => { pieces['fond-halte'].blocs[bi].nappe = await rendreStem(Object.assign({}, MIX_HALTE, { couches: ['fond'] }), 'fond', F.nappe, sr); }]);
      taches.push(['Fond halte ' + (bi + 1) + ', texture', async () => { pieces['fond-halte'].blocs[bi].texture = await rendreStem(Object.assign({}, MIX_HALTE, { couches: ['texture'] }), 'texture', F.texture, sr); }]);
      const T = blocTension(bi, 7), D = blocDanger(bi, -5);
      taches.push(['Tension halte ' + (bi + 1) + ', pulsation', async () => { pieces['tension-halte'].blocs[bi].pulsation = await rendreStem(MIX_TENSION, 'rythmique', T.pulsation, sr); }]);
      taches.push(['Tension halte ' + (bi + 1) + ', texture', async () => { pieces['tension-halte'].blocs[bi].texture = await rendreStem(MIX_TENSION, 'harmonie', T.texture, sr); }]);
      taches.push(['Danger halte ' + (bi + 1) + ', percussions', async () => { pieces['danger-halte'].blocs[bi].percussions = await rendreStem(MIX_DANGER, 'rythmique', D.percussions, sr); }]);
      taches.push(['Danger halte ' + (bi + 1) + ', basse', async () => { pieces['danger-halte'].blocs[bi].basse = await rendreStem(MIX_DANGER, 'basse', D.basse, sr); }]);
      taches.push(['Danger halte ' + (bi + 1) + ', stridences', async () => { pieces['danger-halte'].blocs[bi].stridences = await rendreStem(MIX_DANGER, 'harmonie', D.stridences, sr); }]);
    });
    [0, 1, 2, 3].forEach((bi) => ['pulsation', 'basse', 'texture'].forEach((s) => taches.push(['Exploration ' + (bi + 1) + ', ' + s, async () => { pieces['explo-halte'].blocs[bi][s] = await rendreStem(MIX_HALTE, s, blocExplo(bi)[s], sr); }])));
    taches.push(['Signal arrivée à la halte', async () => { signaux.arriveeHalte = await signal('arriveeHalte', sr, {}); }]);
    for (let i = 0; i < taches.length; i++) { if (progres) progres(i, taches.length, taches[i][0]); await taches[i][1](); }
    if (progres) progres(taches.length, taches.length, 'Prêt');
    const meta = {
      'fond-halte': { role: 'Fond halte (station-service)', tonique: 'la', mode: 'bourdon la-mi, cuve' },
      'explo-halte': { role: 'Exploration halte', tonique: 'la', mode: 'la mineur harmonique' },
      'tension-halte': { role: 'Tension (halte)', tonique: 'la', mode: 'pulsation 3 contre 4, bourdon la-mi' },
      'danger-halte': { role: 'Danger (halte)', tonique: 'la', mode: 'la, sol (♭7), croches 3+3+2' }
    };
    return { pieces, signaux, meta };
  }


  /* ======================= LE COMPTOIR DU CARREFOUR — sol mixolydien, 96 BPM =======================
     Zone sûre : un groove léger (Booker T., Khruangbin). Batterie faite des sons du lieu, un peu de swing ;
     basse ronde sur un riff mixolydien ; l'orgue de pub du jingle Watty devenu orgue de groove ;
     trombones doux qui reprennent le motif de Watty en sol (au Comptoir, on est chez les marchands). */
  const TC = 60 / 96, BAR_C = 4 * TC, X_C = TC / 2;
  const swing = (c) => c * X_C + (c % 2 ? 0.16 * X_C : 0);          // croches légèrement swinguées
  const MIX_COMPTOIR = { rt: [1.8, 1.4, 0.9], predelay: 0.012, verbWet: 0.28, tone: 10000, trim: {}, couches: ['rythmique', 'basse', 'harmonie', 'melodie'] };
  /* [fondamentale grave, notes de l'orgue] : un accord toutes les 2 mesures */
  const COMPTOIR = [
    [[31, [59, 62, 65, 67]], [36, [60, 64, 67, 69]], [31, [59, 62, 65, 67]], [29, [57, 60, 65, 67]]],   // sol 7 · do 6 · sol 7 · fa / sol (le ♭VII)
    [[36, [58, 62, 64, 67]], [31, [59, 62, 65, 67]], [38, [57, 60, 62, 65]], [31, [60, 62, 65, 67]]],   // do 9 · sol 7 · ré m7 · sol 7sus4
    [[28, [59, 62, 64, 67]], [29, [57, 60, 64, 65]], [31, [60, 62, 65, 67]], [31, [59, 62, 65, 67]]],   // mi m7 · fa maj7 · sol 7sus4 · sol 7
    [[33, [57, 60, 64, 67]], [38, [57, 60, 62, 65]], [29, [57, 60, 65, 69]], [31, [59, 62, 65, 67]]]    // la m7 · ré m7 · fa · sol 7
  ];
  /* Riff de basse sur 2 mesures, en croches : [croche, intervalle, durée en croches] (fondamentale, quinte, ♭7, octave) */
  const RIFF = [[0, 0, 3], [3, 7, 1], [5, 10, 1], [6, 12, 2], [8, 0, 2], [11, 7, 1], [13, 5, 1], [14, 7, 2]];
  function orgueGroove(ctx, G, t, midi, dur, vel, pan) {
    const f = mtof(midi), amp = L.voiceOut(ctx, G, 'harmonie', pan || 0, 0.25);
    [[0.5, 0.45], [1, 1], [2, 0.6], [3, 0.3], [4, 0.2]].forEach(([r, a]) => [-5, 5].forEach((c) => {
      const o = ctx.createOscillator(); o.frequency.value = f * r; o.detune.value = c;          // deux copies désaccordées : le tremblement de la cabine
      const g = ctx.createGain(); g.gain.value = a * 0.1; o.connect(g); g.connect(amp); o.start(t); o.stop(t + dur + 0.1);
    }));
    amp.gain.setValueAtTime(0, t); amp.gain.linearRampToValueAtTime(vel, t + 0.008); amp.gain.setValueAtTime(vel, t + dur - 0.03); amp.gain.linearRampToValueAtTime(0, t + dur);
  }
  function basseRonde(ctx, G, t, midi, dur, vel) {
    const f = mtof(midi), amp = L.voiceOut(ctx, G, 'basse', 0, 0.05);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 650; lp.Q.value = 0.8; lp.connect(amp);
    const a = ctx.createOscillator(); a.type = 'triangle'; a.frequency.value = f;
    const b = ctx.createOscillator(); b.frequency.value = f; const bg = ctx.createGain(); bg.gain.value = 0.8; b.connect(bg); bg.connect(lp); a.connect(lp);
    amp.gain.setValueAtTime(0, t); amp.gain.linearRampToValueAtTime(0.09 * vel, t + 0.006); amp.gain.setTargetAtTime(0.055 * vel, t + 0.01, 0.15);   // mesuré : la basse doit rester sous ≈ −20 dB RMS
    amp.gain.setValueAtTime(0.055 * vel, t + dur); amp.gain.linearRampToValueAtTime(0, t + dur + 0.07);
    [a, b].forEach((o) => { o.start(t); o.stop(t + dur + 0.1); });
  }
  function blocComptoir(bi) {
    const C = window.WattComptoir;
    return {
      rythmique: (ctx, G) => {
        const lourd = [0, 1].map(() => C.tampon(ctx, true)), clair = [0, 1].map(() => C.tampon(ctx, false)), clic = [0, 1, 2].map(() => C.compteurElec(ctx, 1)), pap = C.papier(ctx);
        const J = (t, b, gain, pan) => L.jouerSfx(ctx, G, 'rythmique', 0.02 + t, b, { gain, pan: pan || 0, send: 0.15 });
        for (let m = 0; m < BLOC; m++) {
          const t = m * BAR_C;
          [0, 5].forEach((c) => J(t + swing(c), L.pick(lourd), c ? 0.32 : 0.42, -0.05));
          [2, 6].forEach((c) => J(t + swing(c), L.pick(clair), 0.3, 0.1));
          for (let c = 0; c < 8; c++) J(t + swing(c), L.pick(clic), c % 2 ? 0.11 : 0.06, 0.35);
          if (bi >= 2) [1, 3, 5, 7].forEach((c) => J(t + swing(c), pap, 0.06, -0.35));
        }
        if (bi % 2 === 0) J(0, C.caisse(ctx, false), 0.18, 0.4);                          // la sonnette en tête de phrase
        if (bi === 3) J(7 * BAR_C + swing(4), C.caisse(ctx, true), 0.2, 0.4);           // le tiroir, en relance
      },
      basse: (ctx, G) => {
        COMPTOIR[bi].forEach(([r], k) => RIFF.forEach(([c, iv, du]) => basseRonde(ctx, G, 0.02 + k * 2 * BAR_C + swing(c), r + iv, du * X_C * 0.9, c === 0 || c === 8 ? 1 : 0.8)));
      },
      harmonie: (ctx, G) => {
        COMPTOIR[bi].forEach(([, v], k) => {
          const t0 = 0.02 + k * 2 * BAR_C;
          v.forEach((m, i) => orgueGroove(ctx, G, t0, m, 2 * BAR_C - 0.05, 0.07, -0.3 + i * 0.2));            // la nappe d'orgue, douce
          [0, 1].forEach((mm) => [3, 6].forEach((c) => v.forEach((m, i) => orgueGroove(ctx, G, t0 + mm * BAR_C + swing(c), m, X_C * 0.8, 0.12, -0.3 + i * 0.2))));   // les coups d'orgue syncopés
        });
      },
      melodie: (ctx, G) => {
        const T = (beat, m, dur, vel) => window.WattEchantillons.jouer(ctx, G, 'melodie', 'trombone', 0.02 + beat * TC, m, dur * TC, vel, { gain: 0.85, attack: 0.04, release: 0.3, send: 0.3, lp: 2600 });
        if (bi === 1 || bi === 3) {
          /* Le motif de Watty, en sol : ré sol si ré mi ré, puis la question ré → sol */
          const debut = bi === 1 ? 16 : 0;
          [[0, 50, 1], [1, 55, 1], [2, 59, 1], [3, 62, 1], [4, 64, 1.5], [5.5, 62, 2.5], [8, 62, 2], [10, 67, 5]].forEach(([b, m, du]) => T(debut + b, m, du, 0.45));
          [[4, 60, 1.5], [5.5, 59, 2.5], [10, 62, 5]].forEach(([b, m, du]) => T(debut + b, m, du, 0.3));            // le second trombone, à la tierce
        } else {
          [[3.5, 59, 0.5], [7.5, 62, 0.5], [19.5, 60, 0.5], [23.5, 59, 1]].forEach(([b, m, du]) => T(b + (bi === 2 ? 8 : 0), m, du, 0.4));   // petites réponses de cuivres
        }
      }
    };
  }
  async function preparerComptoir(sr, progres) {
    const pieces = { 'comptoir': { stems: ['rythmique', 'basse', 'harmonie', 'melodie'], blocs: [{}, {}, {}, {}] } }, taches = [];
    [0, 1, 2, 3].forEach((bi) => ['rythmique', 'basse', 'harmonie', 'melodie'].forEach((s) => taches.push(['Comptoir ' + (bi + 1) + ', ' + s, async () => { pieces.comptoir.blocs[bi][s] = await rendreStem(MIX_COMPTOIR, s, blocComptoir(bi)[s], sr, BLOC, BAR_C); }])));
    for (let i = 0; i < taches.length; i++) { if (progres) progres(i, taches.length, taches[i][0]); await taches[i][1](); }
    if (progres) progres(taches.length, taches.length, 'Prêt');
    return { pieces, signaux: {}, meta: { comptoir: { role: 'Comptoir du Carrefour (zone sûre)', tonique: 'sol', mode: 'sol mixolydien', bpm: 96 } } };
  }

  /* ---------- Signaux ---------- */
  async function signal(nom, sr, def) {
    const sec = { crepuscule: 9, aube: 9, saisie: 3, degagement: 6, endormissement: 10, feu: 10, eteintRepere: 6, recette: 4, decouverte: 6, comptoir: 7, echange: 3, mort: 10, arriveeHalte: 9 }[nom];
    const ctx = new OfflineAudioContext(2, Math.ceil(sr * sec), sr);
    const G = L.buildGraph(ctx, { couches: ['fond', 'rythmique', 'basse', 'harmonie', 'effets', 'melodie'], rt: [4.5, 3.5, 1.5], predelay: 0.02, verbWet: 0.5, tone: 9000, trim: {} });
    if (nom === 'crepuscule') {        // trois souffles qui descendent : la lumière baisse
      [[64, 0], [57, 0.8], [50, 1.6]].forEach(([m, d]) => L.souffleAccorde(ctx, G, 'harmonie', 0.05 + d, m, 2.5, 1, { couleur: 'fond', gain: 0.06, attack: 1.2, release: 3 }));
      L.souffleAccorde(ctx, G, 'basse', 0.05, 38, 3.5, 1, { couleur: 'fond', gain: 0.05, attack: 2, release: 3 });
    } else if (nom === 'aube') {       // l'inverse, qui monte
      [[50, 0], [57, 0.8], [66, 1.6]].forEach(([m, d]) => L.souffleAccorde(ctx, G, 'harmonie', 0.05 + d, m, 2.5, 1, { couleur: 'fond', gain: 0.06, attack: 1.2, release: 3 }));
      L.ticMetal(ctx, G, 'effets', 2.2, { gain: 0.02 });
    } else if (nom === 'feu') {           // le souffle chaud qui monte du feu : ré, la, mi dans la voix de la famille, en crescendo
      [[38, 0, 'basse'], [50, 0.4, 'harmonie'], [57, 1.2, 'harmonie'], [64, 2.2, 'harmonie']].forEach(([m, d, c]) =>
        (c === 'basse' ? L.souffleAccorde(ctx, G, c, 0.05 + d, m, 5, 1, { couleur: 'fond', gain: 0.05, attack: 3, release: 3.5 })
          : L[def.voix || 'souffleAccorde'](ctx, G, c, 0.05 + d, m, 5 - d, 1, Object.assign({ couleur: def.couleur, gain: def.gainNappe * 0.9, attack: 2.5, release: 3.5 }, def.voixOpts, { grille: 0.05 }))));
    } else if (nom === 'arriveeHalte') {  // arrivée à la halte : un coup de vent dans l'auvent, le néon qui tente de s'allumer, la m qui s'ouvre sur le sol♯
      L.jouerSfx(ctx, G, 'fond', 0.05, window.WattHalte.auvent(ctx, 6), { gain: 0.3, send: 0.3 });
      L.jouerSfx(ctx, G, 'effets', 1.4, window.WattHalte.neonMort(ctx), { gain: 0.12, pan: 0.4, send: 0.4 });
      [[45, 0, 'basse'], [57, 0.5, 'harmonie'], [60, 1.1, 'harmonie'], [64, 1.7, 'harmonie'], [68, 2.6, 'harmonie']].forEach(([m, d, c]) => L.souffleAccorde(ctx, G, c, 0.3 + d, m, 4.2 - d * 0.6, 1, { couleur: 'cuve', gain: 0.045, attack: 1.5, release: 3.5 }));
    } else if (nom === 'eteintRepere') {  // le premier Éteint repéré : la tôle très loin, un souffle grave qui se resserre (ré, mi, fa) et se coupe net
      L.jouerSfx(ctx, G, 'rythmique', 0.05, tole(ctx, true), { gain: 0.2, send: 1.2, lp: 700 });
      [[38, 0], [40, 0.6], [41, 1.2]].forEach(([m, d]) => L.souffleAccorde(ctx, G, 'harmonie', 0.2 + d, m, 2.6 - d, 1, { couleur: 'metal', gain: 0.05, attack: 1.2, release: 0.15 }));
    } else if (nom === 'recette') {       // recette réussie : trois notes claires qui montent (ré, la, mi), du bois et du métal
      [[74, 0], [81, 0.18], [88, 0.36]].forEach(([m, d]) => L.jouerSfx(ctx, G, 'melodie', 0.05 + d, L.sfxBuffer(ctx, 1.6, (x, sr) => { L.ping(x, sr, 0, mtof(m), 1, 0.5); L.ping(x, sr, 0, mtof(m) * 2.76, 0.2, 0.15); }), { gain: 0.12, send: 0.5, pan: -0.3 + d }));
    } else if (nom === 'decouverte') {    // découverte d'une recette : le motif (la ré fa♯ la) en cloches, qui s'ouvre
      [[69, 0], [74, 0.3], [78, 0.6], [81, 0.9]].forEach(([m, d]) => L.jouerSfx(ctx, G, 'melodie', 0.05 + d, L.sfxBuffer(ctx, 3, (x, sr) => { L.ping(x, sr, 0, mtof(m), 1, 1.1); L.ping(x, sr, 0, mtof(m) * 2.01, 0.3, 0.5); L.ping(x, sr, 0, mtof(m) * 3.9, 0.12, 0.2); }), { gain: 0.1, send: 0.7, pan: -0.4 + d * 0.8 }));
      L.souffleAccorde(ctx, G, 'harmonie', 0.6, 62, 2.5, 1, { couleur: 'fond', gain: 0.04, attack: 1, release: 2.5 });
    } else if (nom === 'comptoir') {      // arrivée au Comptoir : sol majeur chaud (sol mixolydien), une sonnette de caisse
      [[43, 'basse'], [55, 'harmonie'], [59, 'harmonie'], [62, 'harmonie'], [65, 'harmonie']].forEach(([m, c], i) => L.souffleAccorde(ctx, G, c, 0.05 + i * 0.15, m, 3, 1, { couleur: c === 'basse' ? 'fond' : 'bois', gain: 0.045, attack: 1, release: 3 }));
      L.jouerSfx(ctx, G, 'melodie', 1.2, L.sfxBuffer(ctx, 2, (x, sr) => { L.ping(x, sr, 0, 2637, 1, 0.6); L.ping(x, sr, 0, 2637 * 2.4, 0.3, 0.3); }), { gain: 0.08, send: 0.4, pan: 0.3 });
    } else if (nom === 'echange') {       // échange conclu : le coup de tampon, et un petit « ding »
      L.jouerSfx(ctx, G, 'rythmique', 0.05, L.sfxBuffer(ctx, 0.5, (x, sr) => { let ph = 0, lp = 0; for (let i = 0; i < 0.3 * sr; i++) { const t = i / sr; ph += 2 * Math.PI * (90 + 60 * Math.exp(-t / 0.02)) / sr; lp += 0.2 * ((Math.random() * 2 - 1) - lp); x[i] = (Math.sin(ph) + lp * 1.5) * Math.exp(-t / 0.05); } }), { gain: 0.35, send: 0.2 });
      L.jouerSfx(ctx, G, 'melodie', 0.35, L.sfxBuffer(ctx, 1.5, (x, sr) => { L.ping(x, sr, 0, mtof(86), 1, 0.4); }), { gain: 0.08, send: 0.4 });
    } else if (nom === 'mort') {          // la mort : le souffle de ré qui descend d'une quinte et s'éteint ; le silence est la suite
      [[50, 'harmonie'], [57, 'harmonie'], [38, 'basse']].forEach(([m, c]) => L.souffleAccorde(ctx, G, c, 0.05, m, 3.5, 1, { couleur: 'fond', gain: 0.05, attack: 0.8, release: 5 }));
      [[45, 2.5], [43, 4.5]].forEach(([m, d]) => L.souffleAccorde(ctx, G, 'basse', 0.05 + d, m, 1.5, 1, { couleur: 'fond', gain: 0.04, attack: 1, release: 3.5 }));
      L.jouerSfx(ctx, G, 'rythmique', 0.05, tole(ctx, true), { gain: 0.15, send: 1.4, lp: 500 });
    } else if (nom === 'endormissement') {   // le motif, lent et à moitié : la ré mi la, qui s'éteint sans conclure
      [[57, 0], [62, 1.2], [64, 2.4], [69, 3.6]].forEach(([m, d]) => L.souffleAccorde(ctx, G, 'harmonie', 0.05 + d, m, 4.5 - d * 0.5, 1, { couleur: 'flute', gain: 0.05, attack: 0.6, release: 4 }));
      L.souffleAccorde(ctx, G, 'basse', 0.05, 38, 4, 1, { couleur: 'fond', gain: 0.04, attack: 1.5, release: 4 });
    } else if (nom === 'saisie') {
      L.jouerSfx(ctx, G, 'rythmique', 0.02, tole(ctx, true), { gain: 0.5, send: 0.3 });
      basseSaturee(ctx, G, 0.02, 38, 0.8, 1);
    } else {                            // dégagement : le souffle retombe sur ré
      L.souffleAccorde(ctx, G, 'harmonie', 0.05, 50, 1.5, 1, { couleur: 'fond', gain: 0.05, attack: 0.3, release: 3.5 });
      L.souffleAccorde(ctx, G, 'basse', 0.05, 38, 1.5, 1, { couleur: 'fond', gain: 0.05, attack: 0.3, release: 4 });
      L.vent(ctx, G, 'fond', 0.05, 1.5, 1, { gain: 0.03, center: 600 });
    }
    return fonduFin(await ctx.startRendering(), 0.5);
  }

  /* ---------- Préparation de toutes les pièces (avec suivi de progression) ---------- */
  async function preparer(familleId, sr, progres) {
    const th = window.WattThemes.find((x) => x.id === familleId), def = th.def;
    const taches = [];
    const pieces = {
      'fond-jour': { stems: ['fond'], blocs: [{}, {}] },
      'fond-nuit': { stems: ['fond'], blocs: [{}, {}] },
      'vie-jour': { stems: ['rythmique', 'basse', 'harmonie', 'effets', 'outil'], blocs: [{}, {}, {}, {}, {}, {}] },
      'vie-nuit': { stems: ['basse', 'harmonie', 'melodie'], blocs: [{}, {}, {}, {}] },
      'tension': { stems: ['pulsation', 'texture'], blocs: [{}, {}] },
      'danger': { stems: ['percussions', 'basse', 'stridences'], blocs: [{}, {}] }
    };
    [0, 1].forEach((bi) => taches.push(['Fond jour, bloc ' + (bi + 1), async () => { pieces['fond-jour'].blocs[bi].fond = await rendreStem(MIX_FOND, 'fond', blocFond(bi, false), sr); }]));
    [0, 1, 2, 3, 4, 5].forEach((bi) => {
      ['rythmique', 'basse', 'harmonie', 'effets'].forEach((s) => taches.push([th.nom + ', bloc ' + (bi + 1) + ', ' + s, async () => { pieces['vie-jour'].blocs[bi][s] = await rendreStem(def.mix, s, blocVie(def, bi), sr); }]));
      taches.push([th.nom + ', bloc ' + (bi + 1) + ', outil (atelier)', async () => { pieces['vie-jour'].blocs[bi].outil = await rendreStem(Object.assign({}, def.mix, { couches: ['outil'], trim: { outil: NIVEAU_OUTIL[familleId] } }), 'outil', blocOutil(familleId, bi), sr); }]);
    });
    [0, 1].forEach((bi) => {
      const T = blocTension(bi);
      taches.push(['Tension, bloc ' + (bi + 1) + ', pulsation', async () => { pieces.tension.blocs[bi].pulsation = await rendreStem(MIX_TENSION, 'rythmique', T.pulsation, sr); }]);
      taches.push(['Tension, bloc ' + (bi + 1) + ', texture', async () => { pieces.tension.blocs[bi].texture = await rendreStem(MIX_TENSION, 'harmonie', T.texture, sr); }]);
    });
    [0, 1].forEach((bi) => {
      const D = blocDanger(bi);
      taches.push(['Danger ' + (bi + 1) + ', percussions', async () => { pieces.danger.blocs[bi].percussions = await rendreStem(MIX_DANGER, 'rythmique', D.percussions, sr); }]);
      taches.push(['Danger ' + (bi + 1) + ', basse', async () => { pieces.danger.blocs[bi].basse = await rendreStem(MIX_DANGER, 'basse', D.basse, sr); }]);
      taches.push(['Danger ' + (bi + 1) + ', stridences', async () => { pieces.danger.blocs[bi].stridences = await rendreStem(MIX_DANGER, 'harmonie', D.stridences, sr); }]);
    });
    const signaux = {};
    ['crepuscule', 'aube', 'saisie', 'degagement', 'endormissement', 'feu', 'eteintRepere', 'recette', 'decouverte', 'comptoir', 'echange', 'mort'].forEach((n) => taches.push(['Signal ' + n, async () => { signaux[n] = await signal(n, sr, def); }]));
    const mixNuit = Object.assign({}, def.mix, { couches: ['basse', 'harmonie', 'melodie'], trim: { basse: 0.25, melodie: 1 } });
    [0, 1, 2, 3].forEach((bi) => ['basse', 'harmonie', 'melodie'].forEach((s) => taches.push([th.nom + ' (nuit), bloc ' + (bi + 1) + ', ' + s, async () => { pieces['vie-nuit'].blocs[bi][s] = await rendreStem(mixNuit, s, blocVieNuit(def, NUIT[familleId], bi), sr); }])));
    [0, 1].forEach((bi) => taches.push(['Fond nuit, bloc ' + (bi + 1), async () => { pieces['fond-nuit'].blocs[bi].fond = await rendreStem(MIX_FOND, 'fond', blocFond(bi, true), sr); }]));
    for (let i = 0; i < taches.length; i++) {
      if (progres) progres(i, taches.length, taches[i][0]);
      await taches[i][1]();
    }
    if (progres) progres(taches.length, taches.length, 'Prêt');
    /* Métadonnées pour le manifeste de production (Book 21 §6.2.1) */
    const MODES = { charbonniers: ['ré dorien → éolien → la 7♭9 (mineur harmonique)', 'ré éolien, do♯ du mineur harmonique'], voltaiques: ['ré lydien → si mineur harmonique', 'si mineur harmonique'], mecanistes: ['ré mixolydien → emprunt doux à sol mineur harmonique', 'emprunt doux à sol mineur harmonique'] }[familleId];
    const meta = {
      'fond-jour': { role: 'Fond terrain, jour', tonique: 'ré', mode: 'bourdon ré-la' },
      'fond-nuit': { role: 'Fond terrain, nuit', tonique: 'ré', mode: 'bourdon ré grave, grillons accordés' },
      'vie-jour': { role: 'Vie ' + th.nom + ', jour', tonique: 'ré', mode: MODES[0], famille: familleId, note: 'stem « outil » actif seulement quand l\'atelier est installé' },
      'vie-nuit': { role: 'Vie ' + th.nom + ', nuit', tonique: 'ré', mode: MODES[1], famille: familleId },
      'tension': { role: 'Tension (terrain)', tonique: 'ré', mode: 'pulsation 3 contre 4, bourdon ré-la' },
      'danger': { role: 'Danger (terrain)', tonique: 'ré', mode: 'ré, do (♭7), croches 3+3+2' }
    };
    return { pieces, signaux, meta };
  }

  /** Instruments échantillonnés nécessaires à une famille (à charger avant preparer) */
  function instruments(familleId) { const m = NUIT[familleId].melodie; return m.inst ? [m.inst] : []; }
  window.WattPieces = { preparer, preparerHalte, preparerComptoir, signal, instruments, instrumentsHalte: ['trombone'], instrumentsComptoir: ['trombone'], BPM, DUREE_BLOC: DUREE };
})();
