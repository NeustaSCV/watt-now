/* Watt Now? — intro : le son de la télé d'Abondance TV, synthétisé dans le navigateur (Web Audio).
   Des petites musiques de programme, volontairement « télé » (kitsch, joyeuses, sans relief), qui passent
   par un haut-parleur de téléviseur ; les bruits des gadgets ; la neige du zapping ; la radio pendant la panne.
   Tout est programmé d'avance à partir d'un instant t0 : programmer(ctx, bus, t0, depuis). */

import { ZAPPINGS } from './plans-tele.js';

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

let BRUIT = null;
function bruitBuffer(ctx) {
  if (BRUIT && BRUIT.sampleRate === ctx.sampleRate) return BRUIT;
  const n = ctx.sampleRate * 2, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  BRUIT = b;
  return b;
}

/** Un petit atelier de synthèse, lié à un contexte, une sortie et un instant d'origine. */
function atelier(ctx, sortie, t0, depuis, sources) {
  const quand = (x) => t0 + x;
  const garde = (x) => x >= depuis - 0.01;   // ne programme pas ce qui a déjà commencé

  function env(g, t, a, d, niveau, fin) {
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(niveau, t + a);
    g.gain.setTargetAtTime(0, t + a, d);
    if (fin) g.gain.setValueAtTime(0, fin);
  }
  function demarre(src, t, fin) {
    const debut = Math.max(t, ctx.currentTime);
    src.start(debut, Math.max(0, debut - t) % 1);
    src.stop(fin);
    sources.push(src);
  }
  function panner(pan) {
    if (!pan || !ctx.createStereoPanner) return sortie;
    const p = ctx.createStereoPanner(); p.pan.value = pan; p.connect(sortie); return p;
  }

  return {
    /** Corde pincée / piano électrique en modulation de fréquence. */
    fm(x, midi, dur, niveau = 0.2, o = {}) {
      if (!garde(x, dur)) return;
      const t = quand(x), f = mtof(midi), ratio = o.ratio || 1, indice = o.indice || 2.5;
      const car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
      car.frequency.value = f; mod.frequency.value = f * ratio;
      mg.gain.setValueAtTime(f * indice, t); mg.gain.setTargetAtTime(f * indice * 0.15, t, o.eclat || 0.08);
      mod.connect(mg); mg.connect(car.frequency); car.connect(g); g.connect(panner(o.pan));
      env(g, t, o.attaque || 0.004, o.chute || dur / 3, niveau);
      demarre(car, t, t + dur + 0.6); demarre(mod, t, t + dur + 0.6);
    },
    /** Basse ronde. */
    basse(x, midi, dur, niveau = 0.3) {
      if (!garde(x, dur)) return;
      const t = quand(x), o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = mtof(midi);
      lp.type = 'lowpass'; lp.frequency.value = 700;
      o.connect(lp); lp.connect(g); g.connect(sortie);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(niveau, t + 0.01); g.gain.setValueAtTime(niveau, t + dur * 0.8); g.gain.linearRampToValueAtTime(0, t + dur);
      demarre(o, t, t + dur + 0.05);
    },
    /** Nappe douce (triangles désaccordés). */
    nappe(x, midis, dur, niveau = 0.08) {
      if (!garde(x, dur)) return;
      const t = quand(x), g = ctx.createGain(), lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 1800; lp.connect(g); g.connect(sortie);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(niveau, t + Math.min(0.8, dur / 3)); g.gain.setValueAtTime(niveau, t + dur - 0.6); g.gain.linearRampToValueAtTime(0, t + dur);
      midis.forEach((m) => [-6, 6].forEach((d) => { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = mtof(m); o.detune.value = d; o.connect(lp); demarre(o, t, t + dur + 0.05); }));
    },
    /** Cloche, carillon. */
    cloche(x, midi, niveau = 0.12, dur = 1.6, pan = 0) {
      if (!garde(x, dur)) return;
      const t = quand(x), f = mtof(midi), dest = panner(pan);
      [[1, 1], [2.76, 0.4], [5.4, 0.2]].forEach(([r, a]) => {
        const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f * r;
        o.connect(g); g.connect(dest); env(g, t, 0.002, dur / (2 + r), niveau * a);
        demarre(o, t, t + dur);
      });
    },
    /** Grosse caisse, caisse claire (frappe de mains), charleston. */
    gc(x, niveau = 0.5) {
      if (!garde(x, 0.3)) return;
      const t = quand(x), o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.12);
      o.connect(g); g.connect(sortie); env(g, t, 0.002, 0.08, niveau); demarre(o, t, t + 0.4);
    },
    bruit(x, dur, niveau, o = {}) {
      if (!garde(x, dur)) return null;
      const t = quand(x), src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = bruitBuffer(ctx); src.loop = true;
      f.type = o.type || 'bandpass'; f.frequency.value = o.f || 2000; f.Q.value = o.q || 0.8;
      src.connect(f); f.connect(g); g.connect(panner(o.pan));
      if (o.tenu) {
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(niveau, t + (o.attaque ?? 0.3));
        g.gain.setValueAtTime(niveau, t + dur - (o.relache ?? 0.3)); g.gain.linearRampToValueAtTime(0, t + dur);
      } else env(g, t, 0.002, o.chute || dur / 4, niveau);
      demarre(src, t, t + dur + 0.05);
      return { g, f, t };
    },
    clap(x, niveau = 0.25) { [0, 0.012, 0.024].forEach((d) => this.bruit(x + d, 0.12, niveau, { f: 1500, q: 1.2, chute: 0.025 })); },
    ch(x, niveau = 0.08) { this.bruit(x, 0.06, niveau, { type: 'highpass', f: 7500, chute: 0.015 }); },
    /** Un son continu, modulé en amplitude (ventilateur, moteur). */
    bourdon(x, dur, freqs, niveau, o = {}) {
      if (!garde(x, dur)) return;
      const t = quand(x), g = ctx.createGain(), lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = o.lp || 1200; lp.connect(g); g.connect(panner(o.pan));
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(niveau, t + (o.attaque ?? 0.4)); g.gain.setValueAtTime(niveau, t + dur - 0.25); g.gain.linearRampToValueAtTime(0, t + dur);
      freqs.forEach(([f, a, type]) => {
        const os = ctx.createOscillator(), og = ctx.createGain(); os.type = type || 'sine'; os.frequency.value = f; og.gain.value = a;
        if (o.vibrato) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = o.vibrato[0]; lg.gain.value = o.vibrato[1]; l.connect(lg); lg.connect(os.frequency); demarre(l, t, t + dur + 0.05); }
        os.connect(og); og.connect(lp); demarre(os, t, t + dur + 0.05);
      });
      if (o.am) {
        const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = o.am[0]; lg.gain.value = niveau * o.am[1];
        l.connect(lg); lg.connect(g.gain); demarre(l, t, t + dur + 0.05);
      }
    },
    /** Pépiement d'oiseau. */
    oiseau(x, niveau = 0.05, pan = 0) {
      if (!garde(x, 0.4)) return;
      const t = quand(x), dest = panner(pan);
      for (let k = 0; k < 3; k++) {
        const o = ctx.createOscillator(), g = ctx.createGain(), d = k * 0.11;
        o.frequency.setValueAtTime(3200 + k * 300, t + d); o.frequency.exponentialRampToValueAtTime(4800, t + d + 0.05); o.frequency.exponentialRampToValueAtTime(2600, t + d + 0.09);
        o.connect(g); g.connect(dest); env(g, t + d, 0.005, 0.03, niveau); demarre(o, t + d, t + d + 0.2);
      }
    },
    /** Glissando d'un moteur (servomoteur, montée). */
    glisse(x, dur, f1, f2, niveau = 0.04, type = 'sawtooth') {
      if (!garde(x, dur)) return;
      const t = quand(x), o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
      o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
      lp.type = 'lowpass'; lp.frequency.value = 2200;
      o.connect(lp); lp.connect(g); g.connect(sortie);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(niveau, t + 0.05); g.gain.setValueAtTime(niveau, t + dur - 0.06); g.gain.linearRampToValueAtTime(0, t + dur);
      demarre(o, t, t + dur + 0.05);
    },
  };
}

/** Une petite boucle rythmique, sur une fenêtre [a, b[, au tempo bpm. Chaque pas : fonction(x, numéro). */
function boucle(a, b, bpm, parTemps, fn) {
  const pas = 60 / bpm / parTemps;
  for (let i = 0, x = a; x < b - 0.02; i++, x = a + i * pas) fn(x, i);
}

/** Le haut-parleur du téléviseur : on coupe les graves et l'extrême aigu, un peu de saturation. */
export function chaineTele(ctx, dest) {
  const entree = ctx.createGain(), hp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter(), ws = ctx.createWaveShaper(), sortie = ctx.createGain();
  hp.type = 'highpass'; hp.frequency.value = 160; hp.Q.value = 0.7;
  lp.type = 'lowpass'; lp.frequency.value = 6500;
  const n = 1024, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n / 2) - 1; c[i] = Math.tanh(1.6 * x) / Math.tanh(1.6); } ws.curve = c;
  entree.connect(hp); hp.connect(lp); lp.connect(ws); ws.connect(sortie); sortie.connect(dest);
  sortie.gain.value = 0.9;
  return { entree, sortie };
}

/**
 * Programme toute la bande-son de la télé (0 → fin de la réclame) et la neige de la radio.
 * @param radios instants (s) où un flash de radio commence (grésillement court)
 */
export function programmerTele(ctx, entreeTele, entreeRadio, t0, depuis, sources, radios = []) {
  const A = atelier(ctx, entreeTele, t0, depuis, sources);
  const R = atelier(ctx, entreeRadio, t0, depuis, sources);

  /* ---- L'allumage : le tube qui claque, puis l'indicatif d'Abondance TV (fanfare kitsch, do majeur) */
  A.gc(0.12, 0.35);
  A.bruit(0.12, 0.5, 0.12, { type: 'highpass', f: 3000, chute: 0.12 });
  [[0.62, [60, 64, 67]], [0.98, [62, 65, 69]], [1.34, [64, 67, 72, 76]]].forEach(([x, ch], i) =>
    ch.forEach((m) => A.fm(x, m + 12, i === 2 ? 1.2 : 0.3, 0.07, { ratio: 1, indice: 3.5, chute: i === 2 ? 0.5 : 0.12 })));
  A.basse(0.62, 36, 0.3, 0.25); A.basse(0.98, 38, 0.3, 0.25); A.basse(1.34, 40, 1.1, 0.25);
  [1.34, 1.45, 1.56, 1.67, 1.78].forEach((x, i) => A.cloche(x, 84 + [0, 4, 7, 12, 16][i], 0.05));

  /* ---- Le zapping : neige et déclic */
  ZAPPINGS.forEach((x) => {
    A.bruit(x - 0.06, 0.3, 0.22, { f: 2600, q: 0.5, chute: 0.12 });
    A.gc(x - 0.06, 0.12);
  });

  /* ---- 1. Téléachat (2,75 → 8,75) : 128 BPM, do majeur, très content de lui */
  const b1 = 60 / 128, a1 = 2.85;
  [[60, 64, 67, 72]].forEach((ch) => ch.forEach((m) => A.fm(a1, m + 12, 0.9, 0.06, { ratio: 1, indice: 4, chute: 0.3 })));   // « ta-daa ! »
  A.cloche(a1 + 0.05, 96, 0.05);
  boucle(a1 + 2 * b1, 8.7, 128, 1, (x, i) => { A.gc(x, 0.35); if (i % 2) A.clap(x, 0.12); });
  boucle(a1 + 2 * b1, 8.7, 128, 2, (x, i) => { if (i % 2) A.ch(x, 0.06); });
  const grille1 = [[48, 64, 67, 72], [53, 65, 69, 72], [55, 62, 67, 71], [48, 64, 67, 72]];
  boucle(a1 + 2 * b1, 8.7, 128, 0.5, (x, i) => {
    const [bas, ...ch] = grille1[i % 4];
    A.basse(x, bas, b1 * 0.9, 0.22); A.basse(x + b1, bas + 12, b1 * 0.5, 0.15);
    ch.forEach((m, k) => A.fm(x + b1 * 0.5 + k * 0.03, m, 0.25, 0.045, { ratio: 2, indice: 1.5 }));
  });
  A.bourdon(4.05, 4.7, [[95, 0.5, 'sawtooth'], [190, 0.25, 'sawtooth']], 0.045, { lp: 500, am: [19, 0.5], attaque: 0.5 });   // le ventilateur
  A.bruit(4.05, 4.7, 0.05, { type: 'lowpass', f: 900, tenu: true, attaque: 0.6 });
  [6.2, 6.32, 6.44, 6.56].forEach((x, i) => A.cloche(x, 88 + i * 2, 0.05));     // « appelez vite ! »

  /* ---- 2. Météo (8,75 → 15) : 96 BPM, piano électrique, accords de septième, tout va bien */
  const b2 = 60 / 96, a2 = 8.9;
  const grille2 = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]];
  boucle(a2, 14.95, 96, 0.5, (x, i) => {
    const ch = grille2[i % 4];
    A.basse(x, ch[0] - 12, b2 * 1.8, 0.2);
    ch.forEach((m, k) => A.fm(x + k * 0.015, m + 12, b2 * 1.8, 0.04, { ratio: 1, indice: 1.2, chute: 0.6 }));
  });
  boucle(a2, 14.95, 96, 2, (x, i) => A.bruit(x, 0.08, i % 2 ? 0.03 : 0.018, { type: 'highpass', f: 6000, chute: 0.03 }));
  [12.1, 12.7, 13.6, 14.3].forEach((x, i) => A.oiseau(x, 0.035, i % 2 ? 0.4 : -0.3));
  A.bourdon(11.95, 3.0, [[98, 0.5], [196, 0.3]], 0.05, { lp: 600, am: [1.6, 0.6] });                               // le sèche-linge tourne
  boucle(12.1, 14.9, 100, 1, (x) => A.gc(x, 0.06));

  /* ---- 3. Tendances (15 → 21) : 110 BPM, petit funk de magazine */
  const b3 = 60 / 110, a3 = 15.1;
  boucle(a3, 20.95, 110, 4, (x, i) => { if (i % 2 === 0 || i % 4 === 3) A.ch(x, i % 4 === 0 ? 0.06 : 0.035); });
  boucle(a3, 20.95, 110, 1, (x, i) => { if (i % 2 === 0) A.gc(x, 0.3); else A.clap(x, 0.1); });
  const ligne3 = [50, 50, 62, 50, 53, 55, 50, 57];
  boucle(a3, 20.95, 110, 2, (x, i) => {
    if ([0, 3, 4, 6].includes(i % 8)) A.basse(x, ligne3[i % 8] - 12, b3 * 0.4, 0.22);
    if (i % 4 === 1) [62, 66, 69].forEach((m) => A.fm(x, m + 12, 0.12, 0.035, { ratio: 3, indice: 1, chute: 0.04 }));
  });
  A.bourdon(15.1, 2.9, [[60, 0.6], [120, 0.3]], 0.05, { lp: 400 });                                                 // l'escalator
  boucle(15.3, 17.9, 2, 1, (x) => A.bruit(x, 0.05, 0.05, { f: 1800, q: 3, chute: 0.015 }));
  A.bourdon(18.05, 2.95, [[185, 0.4, 'sawtooth'], [372, 0.2, 'sawtooth']], 0.03, { lp: 1800, vibrato: [7, 6], pan: 0 });  // la laisse-drone
  A.bruit(19.4, 0.25, 0.08, { f: 700, q: 2, chute: 0.08 }); A.bruit(19.62, 0.25, 0.07, { f: 650, q: 2, chute: 0.08 });  // « wouf wouf »

  /* ---- 4. Bien-être (21 → 27) : nappe, carillons, souffle */
  A.nappe(21.1, [60, 64, 67, 71, 74], 5.9, 0.035);
  [21.4, 22.3, 23.1, 23.9, 25.0, 25.9].forEach((x, i) => A.cloche(x, [79, 84, 86, 83, 88, 91][i], 0.04, 2.2, i % 2 ? 0.5 : -0.5));
  // le servomoteur du fauteuil, qui va et vient avec le bras
  for (let k = 0; k < 2; k++) { const x = 21 + 0.4 + k * 2.62; A.glisse(x + 0.2, 0.9, 420, 760, 0.018); A.glisse(x + 1.5, 0.9, 760, 420, 0.018); }
  A.cloche(24.32, 93, 0.09, 0.8); A.cloche(24.42, 98, 0.07, 0.8);                                                     // la notification
  [[25.66, 84], [25.76, 88], [25.86, 91], [25.96, 96]].forEach(([x, m]) => A.fm(x, m, 0.5, 0.05, { ratio: 2, indice: 1 }));  // « Bravo ! »

  /* ---- 5. Nature & vous (27 → 33) : pluie et arroseurs, puis marimba ensoleillé */
  A.bruit(27.05, 3.0, 0.12, { f: 3500, q: 0.4, tenu: true, attaque: 0.2 });   // pluie
  A.bruit(27.05, 3.0, 0.05, { type: 'lowpass', f: 400, tenu: true, attaque: 0.2 });
  boucle(27.2, 29.95, 330, 1, (x) => A.bruit(x, 0.06, 0.05, { type: 'highpass', f: 4500, chute: 0.02 }));        // tchk-tchk des arroseurs
  const b5 = 60 / 104;
  boucle(30.05, 32.95, 104, 2, (x, i) => {
    const ligne = [67, 71, 74, 79, 76, 74, 71, 74];
    A.fm(x, ligne[i % 8], 0.3, 0.05, { ratio: 4, indice: 0.8, chute: 0.08 });
    if (i % 4 === 0) A.basse(x, 43 + (i % 8 === 4 ? 5 : 0), b5 * 1.5, 0.18);
  });
  [30.2, 30.9, 31.8].forEach((x, i) => A.oiseau(x, 0.03, i % 2 ? 0.5 : -0.4));
  A.bourdon(30.0, 2.0, [[210, 0.4, 'sawtooth'], [420, 0.2, 'sawtooth']], 0.03, { lp: 1800, vibrato: [6, 5], attaque: 1.2 });   // le drone livreur
  A.gc(32.42, 0.3); A.bruit(32.42, 0.15, 0.06, { type: 'lowpass', f: 900, chute: 0.04 });                              // la pomme tombe : « pof »

  /* ---- La radio de la Grande Panne : un grésillement au début de chaque flash */
  radios.forEach((x) => {
    R.bruit(x - 0.35, 0.9, 0.11, { f: 2400, q: 0.6, tenu: true, attaque: 0.05, relache: 0.4 });
    R.cloche(x - 0.1, 81, 0.035, 0.3); R.cloche(x + 0.05, 81, 0.035, 0.3);
  });
}

/** La radio : bande étroite, saturée. */
export function chaineRadio(ctx, dest) {
  const entree = ctx.createGain(), bp = ctx.createBiquadFilter(), ws = ctx.createWaveShaper(), sortie = ctx.createGain();
  bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.9;
  const n = 1024, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n / 2) - 1; c[i] = Math.tanh(2.5 * x); } ws.curve = c;
  entree.connect(bp); bp.connect(ws); ws.connect(sortie); sortie.connect(dest);
  sortie.gain.value = 0.7;
  return { entree, sortie };
}
