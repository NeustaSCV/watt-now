/* Watt Now? — esquisses des trois thèmes de famille (couche Vie, jour).
   Grille commune (Book 21 §6.2.1) : 84 BPM, 4/4, tonique ré (terrain).
   Forme de chaque esquisse : bloc A (8 mesures) + bloc B (8 mesures) + coda (4 mesures) = 20 mesures ≈ 57 s.
   Notes MIDI : 38 = ré 1 (D2), 50 = ré 2 (D3), 62 = ré 3 (D4). Pas : doubles croches (16 par mesure). */
(function () {
  'use strict';

  const S16 = (bpm) => 60 / bpm / 4;
  const at = (t, step, s16, swing) => t + step * s16 + ((swing && step % 2 === 1) ? swing * s16 : 0) + (Math.random() - 0.5) * 0.008;
  const hv = (v) => Math.max(0.05, Math.min(1, v * (0.9 + Math.random() * 0.2)));

  /* Fond terrain, commun : ressort frotté sur ré et la (Book 21 §6.2.2) */
  function fond(ctx, G, b, t, L, bpm, bars) {
    if (b === 0 || b === 8 || b === 16) {
      const n = b === 16 ? 4 : 8, d = n * 240 / bpm;
      L.ressortFrotte(ctx, G, 'fond', t, 38, d + 2, 1, { gain: 0.05, pan: -0.15 });
      L.ressortFrotte(ctx, G, 'fond', t + 1.5, 45, d, 1, { gain: 0.03, pan: 0.2 });
    }
  }
  /* Accord d'une mesure (avec changement à mi-mesure éventuel) */
  function chordAt(C, b, step) { const c = C[b]; return (c.split && step >= c.split) ? { r: c.r2, v: c.v2 } : { r: c.r, v: c.v }; }
  function playMel(L, fn, ctx, G, t, s16, swing, notes, opts, prev) {
    let last = prev;
    (notes || []).forEach(([m, st, du]) => {
      fn(ctx, G, 'melodie', at(t, st, s16, swing), m, du * s16 * 1.02, hv(0.75), Object.assign({}, opts, { glideFrom: last && opts.glide ? last : null }));
      last = m;
    });
    return last;
  }

  /* =========================================================
     🔥 CHARBONNIERS — ré dorien, glissement éolien en B
     Fanfare de forge : enclume (ressort à lames), tôle, fût ; contrebasse ;
     guitare baryton et trombones ; trombone solo, saxophone baryton en contrechant.
     ========================================================= */
  const CH = [
    { r: 38, v: [53, 57, 60, 64] }, { r: 38, v: [53, 57, 60, 64] },          // Ré m9
    { r: 38, v: [55, 59, 62, 64] },                                           // Mi m7 / ré
    { r: 38, v: [55, 59, 62, 67] },                                           // Sol / ré (IV majeur du dorien)
    { r: 34, v: [53, 57, 62, 64] },                                           // Si♭ maj7♯11
    { r: 36, v: [55, 57, 62, 64] },                                           // Do 6/9
    { r: 33, v: [55, 60, 62, 64] },                                           // La m11
    { r: 33, v: [55, 59, 62, 64], split: 8, r2: 33, v2: [55, 61, 65] },      // La 7sus4 → La 7♭13
    { r: 31, v: [53, 57, 58, 62] },                                           // Sol m9 (si♭ : éolien)
    { r: 36, v: [52, 58, 62, 67] },                                           // Do 9
    { r: 41, v: [52, 57, 60, 67] },                                           // Fa maj9
    { r: 34, v: [53, 57, 62, 64] },                                           // Si♭ maj7♯11
    { r: 40, v: [52, 55, 58, 62] },                                           // Mi m7♭5
    { r: 33, v: [55, 61, 65] },                                               // La 7♭13
    { r: 38, v: [53, 57, 60, 64] },                                           // Ré m9
    { r: 38, v: [53, 59, 62, 64] },                                           // Ré m6/9 (retour du si♮ dorien)
    { r: 38, v: [55, 59, 62, 67] }, { r: 38, v: [53, 57, 60, 64] },
    { r: 34, v: [53, 57, 62, 64] }, { r: 38, v: [50, 57, 60, 64, 69] }        // coda
  ];
  const CH_MEL = [[], [],
    [[57, 0, 4], [60, 4, 2], [59, 6, 2], [57, 8, 2], [55, 10, 6]],
    [[57, 2, 2], [59, 4, 4], [62, 8, 8]],
    [[64, 0, 6], [62, 6, 2], [60, 8, 4], [57, 12, 4]],
    [[55, 0, 4], [57, 4, 2], [60, 6, 2], [62, 8, 8]],
    [[64, 0, 3], [67, 3, 3], [64, 6, 2], [62, 8, 4], [60, 12, 4]],
    [[62, 0, 6], [61, 8, 4], [64, 12, 4]],
    [[65, 0, 8], [62, 8, 2], [65, 10, 2], [67, 12, 4]],
    [[69, 0, 6], [67, 6, 2], [64, 8, 8]],
    [[65, 0, 4], [64, 4, 2], [60, 6, 2], [57, 8, 8]],
    [[58, 0, 4], [62, 4, 4], [64, 8, 8]],
    [[67, 0, 4], [65, 4, 2], [64, 6, 2], [62, 8, 4], [58, 12, 4]],
    [[57, 0, 4], [61, 4, 4], [64, 8, 4], [65, 12, 4]],
    [[64, 0, 8], [62, 8, 8]],
    [[59, 0, 6], [57, 6, 2], [62, 8, 8]],
    [[62, 0, 4], [59, 4, 4], [55, 8, 8]],
    [[57, 0, 16]], [], [[50, 0, 16]]];

  const charbonniers = {
    id: 'charbonniers', nom: 'Charbonniers', bpm: 84, bars: 20,
    mix: { verbSeconds: 3.2, verbDecay: 2.6, verbBright: 0.35, verbWet: 0.3 },
    bar(ctx, G, b, t, L) {
      const s16 = S16(this.bpm), sw = 0.3, coda = b >= 16, last = b === 19;
      fond(ctx, G, b, t, L, this.bpm, this.bars);
      /* Rythmique : demi-temps balancé */
      if (!last) {
        L.fut(ctx, G, 'rythmique', at(t, 0, s16, sw), hv(0.9));
        if (!coda) L.fut(ctx, G, 'rythmique', at(t, 10, s16, sw), hv(0.55));
        L.anvil(ctx, G, 'rythmique', at(t, 8, s16, sw), 50, hv(coda ? 0.6 : 0.85), { pan: 0.05 });
        if (b % 2 === 1 && !coda) { L.anvil(ctx, G, 'rythmique', at(t, 14, s16, sw), 62, hv(0.35), { pan: 0.35, ring: 0.6 }); L.anvil(ctx, G, 'rythmique', at(t, 15, s16, sw), 62, hv(0.2), { pan: 0.35, ring: 0.4 }); }
        if (b >= 1) for (let s = 0; s < 16; s += 2) L.tole(ctx, G, 'rythmique', at(t, s, s16, sw), hv(s % 4 === 2 ? 0.45 : 0.22), { pan: -0.3, decay: s % 4 === 2 ? 0.16 : 0.07 });
        if (b === 7 || b === 15) [12, 13, 14, 15].forEach((s, i) => L.tole(ctx, G, 'rythmique', at(t, s, s16, sw), hv(0.3 + i * 0.12), { pan: 0.25, decay: 0.09, freqs: [480, 1180, 2600] }));
      } else {
        L.anvil(ctx, G, 'rythmique', t, 38, 1, { ring: 2.2, gain: 0.3 });
        L.fut(ctx, G, 'rythmique', t, 1);
      }
      /* Basse : contrebasse pizzicato */
      const c0 = CH[b], nxt = CH[Math.min(b + 1, CH.length - 1)];
      const bass = (st, m, du, v) => L.pluck(ctx, G, 'basse', at(t, st, s16, sw), m, du * s16, hv(v), { bright: 0.22, decay: 0.993, len: 1.8, gain: 0.95, send: 0.08, body: 110 });
      if (last) bass(0, 38, 16, 0.9);
      else {
        bass(0, c0.r, 5, 0.9);
        bass(6, chordAt(CH, b, 6).r + 7, 3, 0.6);
        bass(10, chordAt(CH, b, 10).r + 12, 2, 0.55);
        bass(14, nxt.r === c0.r ? c0.r + 10 : nxt.r - 1, 2, 0.6);
      }
      /* Harmonie : guitare baryton grattée + trombones tenus */
      if (b >= 1) {
        const strum = (st, v, up) => { const ch = chordAt(CH, b, st); const notes = up ? ch.v.slice().reverse() : ch.v; notes.forEach((m, i) => L.pluck(ctx, G, 'harmonie', at(t, st, s16, sw) + i * 0.014, m - 12, 6 * s16, hv(v), { bright: 0.35, decay: 0.995, len: 2.2, gain: 0.28, pan: -0.35, send: 0.22, body: 210 })); };
        strum(0, 0.65, false);
        if (!last) { strum(6, 0.4, true); if (b % 2 === 0) strum(11, 0.32, false); }
        if (CH[b].split) strum(8, 0.55, false);
      }
      if (b >= 2) {
        const parts = CH[b].split ? [[0, 8], [8, 8]] : [[0, 16]];
        parts.forEach(([st, du]) => { const ch = chordAt(CH, b, st); ch.v.slice(0, 3).forEach((m, i) => L.brass(ctx, G, 'harmonie', t + st * s16 + 0.02, m, du * s16 * (last ? 2 : 1), hv(b >= 8 && b < 16 ? 0.55 : 0.4), { kind: 'trombone', vib: false, gain: 0.06, pan: -0.1 + i * 0.15, send: 0.4 })); });
      }
      /* Mélodie : trombone solo ; saxophone baryton en contrechant dans le bloc B */
      playMel(L, L.brass, ctx, G, t, s16, sw, CH_MEL[b], { kind: 'trombone', gain: 0.2, pan: 0.12, send: 0.32 });
      if (b >= 8 && b < 16) {
        const cs = [[c0.r + 12, 0, 6], [c0.r + 19, 8, 6]];
        cs.forEach(([m, st, du]) => L.brass(ctx, G, 'melodie', at(t, st, s16, sw), m, du * s16, hv(0.5), { kind: 'sax', gain: 0.1, pan: -0.25, send: 0.25 }));
      }
    }
  };

  /* =========================================================
     ⚡ VOLTAÏQUES — ré lydien ♭7 (acoustique), glissement mixolydien en B
     Électricité qui reste : bornes de batterie, grésillement radio, coup de
     transformateur, ronflement secteur sur la (55 Hz) ; basse analogique ;
     Rhodes et nappe ; synthé lead avec portamento et écho.
     ========================================================= */
  const VO = [
    { r: 38, v: [54, 60, 64, 68] }, { r: 38, v: [57, 60, 64, 68] },          // Ré 9♯11 (sol♯ et do♮)
    { r: 38, v: [56, 59, 62, 66] }, { r: 38, v: [56, 59, 62, 66] },          // Mi 9 / ré
    { r: 36, v: [52, 56, 59, 64] },                                           // Do maj7♯5
    { r: 35, v: [57, 62, 64, 66] },                                           // Si m11
    { r: 33, v: [56, 60, 64, 69] },                                           // La m(maj7)
    { r: 40, v: [57, 62, 64, 69], split: 8, r2: 40, v2: [56, 62, 66, 71] },  // Mi 7sus4 → Mi 9
    { r: 43, v: [54, 57, 59, 62] },                                           // Sol maj9 (sol♮ : mixolydien)
    { r: 38, v: [55, 60, 62, 64] },                                           // Ré 9sus4
    { r: 40, v: [55, 59, 62, 66] },                                           // Mi m9
    { r: 33, v: [55, 59, 60, 64] },                                           // La m9
    { r: 34, v: [57, 62, 64, 65] },                                           // Si♭ maj7♯11 : l'éclat
    { r: 36, v: [55, 59, 62, 64] },                                           // Do maj9
    { r: 40, v: [56, 62, 66, 71] },                                           // Mi 9 (retour du sol♯)
    { r: 38, v: [54, 60, 64, 68] },                                           // Ré 9♯11
    { r: 38, v: [56, 59, 64] }, { r: 38, v: [54, 60, 64, 68] },
    { r: 38, v: [56, 59, 62, 66] }, { r: 38, v: [54, 57, 60, 64, 68] }       // coda
  ];
  const VO_MEL = [[], [],
    [[69, 0, 2], [71, 2, 2], [68, 4, 6], [64, 10, 2], [66, 12, 4]],
    [[68, 2, 2], [69, 4, 2], [72, 6, 6], [71, 12, 4]],
    [[76, 0, 4], [74, 4, 2], [71, 6, 2], [68, 8, 8]],
    [[66, 0, 3], [69, 3, 3], [74, 6, 2], [76, 8, 4], [78, 12, 4]],
    [[76, 0, 6], [72, 6, 2], [68, 8, 6], [69, 14, 2]],
    [[71, 0, 4], [74, 4, 4], [78, 8, 4], [76, 12, 4]],
    [[74, 0, 6], [69, 6, 2], [71, 8, 8]],
    [[72, 0, 4], [74, 4, 2], [76, 6, 2], [79, 8, 8]],
    [[78, 0, 4], [76, 4, 4], [74, 8, 4], [71, 12, 4]],
    [[72, 0, 6], [71, 6, 2], [67, 8, 8]],
    [[77, 0, 4], [76, 4, 4], [74, 8, 4], [69, 12, 4]],
    [[67, 0, 4], [71, 4, 4], [74, 8, 8]],
    [[68, 0, 4], [71, 4, 4], [74, 8, 4], [78, 12, 4]],
    [[76, 0, 8], [80, 8, 8]],
    [], [[69, 0, 16]], [], [[74, 0, 16]]];

  let voLastLead = null, voLastBass = null;
  const voltaiques = {
    id: 'voltaiques', nom: 'Voltaïques', bpm: 84, bars: 20,
    mix: { verbSeconds: 2.2, verbDecay: 3, verbBright: 0.6, verbWet: 0.22, delay: 3 * 60 / 84 / 4, delayFb: 0.33,
      trim: { rythmique: 0.35, basse: 0.8, harmonie: 0.6, melodie: 2 } },
    bar(ctx, G, b, t, L) {
      const s16 = S16(this.bpm), coda = b >= 16, last = b === 19;
      if (b === 0) { voLastLead = null; voLastBass = null; }
      fond(ctx, G, b, t, L, this.bpm, this.bars);
      /* Rythmique : bornes, radio, transformateur, ronflement */
      if (b === 0 || b === 8 || b === 16) L.hum(ctx, G, 'rythmique', t, (b === 16 ? 4 : 8) * 240 / this.bpm, 1, { gain: 0.045 });
      if (!last) {
        L.thump(ctx, G, 'rythmique', at(t, 0, s16), hv(0.9));
        if (!coda) { L.thump(ctx, G, 'rythmique', at(t, 7, s16), hv(0.45)); L.thump(ctx, G, 'rythmique', at(t, 10, s16), hv(0.7)); if (b % 2 === 1) L.thump(ctx, G, 'rythmique', at(t, 14, s16), hv(0.35)); }
        if (b >= 1 && !coda) { L.radio(ctx, G, 'rythmique', at(t, 4, s16), 0.11, hv(0.9), { pan: -0.1 }); L.radio(ctx, G, 'rythmique', at(t, 12, s16), 0.13, hv(1), { pan: 0.1 }); }
        for (let s = 0; s < 16; s++) {
          if (coda && s % 2) continue;
          const acc = s % 4 === 2;
          L.borne(ctx, G, 'rythmique', at(t, s, s16), hv(acc ? 0.42 : (s % 2 ? 0.12 : 0.22)), { pan: s % 2 ? 0.35 : -0.35, pitch: acc ? 2500 : 3300, echo: acc ? 0.15 : 0 });
        }
      } else { L.thump(ctx, G, 'rythmique', t, 0.8); L.radio(ctx, G, 'rythmique', t + 0.6, 2.2, 0.5, { gain: 0.06 }); }
      /* Basse analogique syncopée, avec glissés */
      const c0 = VO[b], nxt = VO[Math.min(b + 1, VO.length - 1)];
      const bass = (st, m, du, v) => { L.synthBass(ctx, G, 'basse', at(t, st, s16), m, du * s16, hv(v), { glideFrom: voLastBass && Math.abs(voLastBass - m) <= 12 ? voLastBass : null }); voLastBass = m; };
      if (last) bass(0, 38, 14, 0.8);
      else if (coda) { bass(0, c0.r, 6, 0.8); bass(10, c0.r, 4, 0.6); }
      else {
        const r = chordAt(VO, b, 0).r, r2 = chordAt(VO, b, 8).r;
        bass(0, r, 3, 0.9); bass(3, r, 2, 0.55); bass(6, r + 12, 2, 0.6); bass(10, r2, 2, 0.75); bass(12, r2 + 7, 2, 0.5); bass(14, nxt.r === r2 ? r2 + 10 : nxt.r + 1, 2, 0.55);
      }
      /* Harmonie : Rhodes en hachures syncopées ; nappe analogique dans le bloc B */
      if (b >= 1) {
        const hit = (st, du, v) => { const ch = chordAt(VO, b, st); ch.v.forEach((m, i) => L.rhodes(ctx, G, 'harmonie', at(t, st, s16) + i * 0.004, m, du * s16, hv(v), { pan: -0.3 + i * 0.2, echo: st === 10 ? 0.2 : 0 })); };
        if (last) hit(0, 16, 0.6);
        else { hit(2, 3, 0.62); hit(7, 2, 0.45); hit(10, 5, 0.58); }
      }
      if (b >= 8 && !last) VO[b].v.forEach((m, i) => L.pad(ctx, G, 'harmonie', t, m, 16 * s16, 0.8, { cutoff: 1400, gain: 0.032, pan: -0.4 + i * 0.27 }));
      if (last) VO[b].v.forEach((m, i) => L.pad(ctx, G, 'harmonie', t, m, 14 * s16, 0.8, { cutoff: 1100, gain: 0.035, pan: -0.4 + i * 0.2 }));
      /* Mélodie : synthé lead, portamento entre les notes, écho à la double croche pointée */
      voLastLead = playMel(L, L.lead, ctx, G, t, s16, 0, VO_MEL[b], { gain: 0.075, pan: 0.12, glide: true, echo: 0.3 }, voLastLead);
    }
  };

  /* =========================================================
     ⚙️ MÉCANISTES — ré mixolydien, glissement mixolydien ♭6 en B
     Atelier de bois et de cordes : chaîne et roue libre de vélo en 3+3+2, blocs
     de bois ; violoncelle (pizzicato puis archet) ; guitare acoustique en
     arpèges, rayons pincés ; violon.
     ========================================================= */
  const ME = [
    { r: 38, v: [50, 57, 62, 64, 69] }, { r: 38, v: [50, 57, 62, 66, 69] },  // Ré sus2 → Ré
    { r: 38, v: [50, 55, 60, 62, 64] },                                       // Do add9 / ré
    { r: 38, v: [50, 55, 59, 62, 67] },                                       // Sol / ré
    { r: 45, v: [57, 60, 64, 67] },                                           // La m7
    { r: 40, v: [52, 55, 59, 62, 67] },                                       // Mi m7
    { r: 48, v: [48, 55, 62, 64] },                                           // Do add9
    { r: 38, v: [50, 55, 60, 62, 67], split: 8, r2: 38, v2: [50, 54, 57, 62, 66] }, // Ré 7sus4 → Ré
    { r: 43, v: [55, 58, 62, 66] },                                           // Sol m(maj7) (si♭ : mixolydien ♭6)
    { r: 48, v: [52, 58, 62, 67] },                                           // Do 9
    { r: 46, v: [58, 62, 66, 69] },                                           // Si♭ maj7♯5 : l'accord rare
    { r: 45, v: [57, 60, 64, 67] },                                           // La m7
    { r: 43, v: [55, 58, 62, 64] },                                           // Sol m6
    { r: 48, v: [55, 60, 62, 64] },                                           // Do add9
    { r: 38, v: [50, 55, 57, 62], split: 8, r2: 38, v2: [50, 54, 57, 62] }, // Ré sus4 → Ré
    { r: 38, v: [50, 57, 62, 66, 69] },                                       // Ré (retour du si♮)
    { r: 38, v: [50, 55, 59, 62, 67] }, { r: 38, v: [50, 55, 60, 64] },
    { r: 38, v: [50, 55, 59, 62, 67] }, { r: 38, v: [50, 57, 62, 66, 69] }   // coda
  ];
  const ME_MEL = [[], [],
    [[69, 0, 3], [67, 3, 3], [64, 6, 2], [62, 8, 8]],
    [[71, 0, 3], [69, 3, 3], [67, 6, 2], [74, 8, 8]],
    [[76, 0, 6], [74, 6, 2], [72, 8, 4], [69, 12, 4]],
    [[71, 0, 6], [67, 6, 2], [64, 8, 8]],
    [[67, 0, 3], [69, 3, 3], [72, 6, 2], [74, 8, 8]],
    [[72, 0, 4], [69, 4, 4], [66, 8, 8]],
    [[70, 0, 6], [69, 6, 2], [67, 8, 4], [66, 12, 4]],
    [[64, 0, 4], [67, 4, 2], [70, 6, 2], [74, 8, 8]],
    [[78, 0, 6], [74, 6, 2], [70, 8, 8]],
    [[72, 0, 4], [76, 4, 4], [74, 8, 4], [72, 12, 4]],
    [[70, 0, 6], [67, 6, 2], [64, 8, 8]],
    [[67, 0, 3], [69, 3, 3], [72, 6, 2], [76, 8, 8]],
    [[74, 0, 4], [67, 4, 4], [66, 8, 8]],
    [[69, 0, 3], [71, 3, 3], [74, 6, 2], [69, 8, 8]],
    [[74, 0, 8], [71, 8, 8]], [[72, 0, 8], [67, 8, 8]], [[71, 0, 16]], [[74, 0, 16]]];
  const ACC = [0, 3, 6, 8, 11, 14]; /* 3+3+2, deux fois par mesure */
  const ARP = [0, 2, 4, 1, 3, 0, 2, 4, 1, 3, 0, 4, 2, 1, 3, 4];

  const mecanistes = {
    id: 'mecanistes', nom: 'Mécanistes', bpm: 84, bars: 20,
    mix: { verbSeconds: 1.6, verbDecay: 3.5, verbBright: 0.55, verbWet: 0.2,
      trim: { rythmique: 3, harmonie: 2.1, melodie: 1.9 } },
    bar(ctx, G, b, t, L) {
      const s16 = S16(this.bpm), sw = 0.08, coda = b >= 16, last = b === 19;
      fond(ctx, G, b, t, L, this.bpm, this.bars);
      /* Rythmique : chaîne de vélo, bois, roue libre */
      if (!last) {
        for (let s = 0; s < 16; s++) {
          if (coda && !ACC.includes(s)) continue;
          L.chaine(ctx, G, 'rythmique', at(t, s, s16, sw), hv(ACC.includes(s) ? 0.6 : 0.22), { pan: 0.25 });
        }
        if (b >= 1) {
          [[0, 0.75], [8, 0.65], [11, 0.4]].forEach(([s, v]) => L.bois(ctx, G, 'rythmique', at(t, s, s16, sw), 55, hv(v), { pan: -0.15 }));
          if (!coda) [[6, 0.45], [14, 0.45]].forEach(([s, v]) => L.bois(ctx, G, 'rythmique', at(t, s, s16, sw), 79, hv(v), { pan: 0.3 }));
        }
        if (b === 7 || b === 15) L.roueLibre(ctx, G, 'rythmique', at(t, 12, s16, sw), 0.62, 0.8, { pan: 0.3 });
      } else L.roueLibre(ctx, G, 'rythmique', t + 0.4, 1.6, 0.9, { pan: 0.2 });
      /* Basse : violoncelle pizzicato (A), à l'archet (B) */
      const c0 = ME[b], nxt = ME[Math.min(b + 1, ME.length - 1)];
      const pizz = (st, m, du, v) => L.pluck(ctx, G, 'basse', at(t, st, s16, sw), m, du * s16, hv(v), { bright: 0.3, decay: 0.994, len: 1.4, gain: 0.85, send: 0.12, body: 180 });
      if (b < 8 || coda) {
        if (last) pizz(0, 38, 16, 0.85);
        else { const r = chordAt(ME, b, 0).r, r2 = chordAt(ME, b, 8).r; pizz(0, r, 3, 0.9); pizz(3, r, 3, 0.5); pizz(6, r + 7, 2, 0.6); pizz(8, r2, 3, 0.8); pizz(11, r2 + 7, 3, 0.5); pizz(14, nxt.r === r2 ? r2 + 12 : nxt.r - 2, 2, 0.55); }
      } else {
        L.bowed(ctx, G, 'basse', t + 0.02, c0.r, 8 * s16, hv(0.7), { kind: 'violoncelle', gain: 0.14, pan: -0.2, attack: 0.2 });
        L.bowed(ctx, G, 'basse', t + 8 * s16, chordAt(ME, b, 8).r + 7, 8 * s16, hv(0.6), { kind: 'violoncelle', gain: 0.12, pan: -0.2, attack: 0.2 });
      }
      /* Harmonie : guitare acoustique en arpèges 3+3+2, rayons pincés */
      if (b >= 1) {
        const steps = last ? [0, 1, 2, 3, 4] : (coda ? ACC : [...Array(16).keys()]);
        steps.forEach((s, k) => {
          const ch = chordAt(ME, b, s), m = ch.v[ARP[s] % ch.v.length];
          L.pluck(ctx, G, 'harmonie', at(t, s, s16, sw) + (last ? k * 0.06 : 0), m, (last ? 16 : 5) * s16, hv(ACC.includes(s) ? 0.62 : 0.4), { bright: 0.55, decay: 0.996, len: last ? 4 : 2.2, gain: 0.24, pan: -0.3, send: 0.2, body: 230 });
        });
        if (!coda && b >= 2) [[6, 81], [14, 86]].forEach(([s, m]) => L.pluck(ctx, G, 'harmonie', at(t, s, s16, sw), m, 3 * s16, hv(0.4), { bright: 0.95, decay: 0.988, len: 0.8, gain: 0.1, pan: 0.45, send: 0.35 }));
      }
      /* Mélodie : violon */
      playMel(L, L.bowed, ctx, G, t, s16, sw, ME_MEL[b], { kind: 'violon', gain: 0.11, pan: 0.15, attack: 0.09 });
    }
  };

  window.WattThemes = [charbonniers, voltaiques, mecanistes];
  window.WattThemesInfo = {
    charbonniers: { mode: 'Ré dorien → éolien (bloc B) → dorien', couleur: 'Fanfare de forge, demi-temps balancé', instruments: 'Enclume (ressort à lames), tôle, fût · contrebasse · guitare baryton, trombones · trombone solo, saxophone baryton' },
    voltaiques: { mode: 'Ré lydien ♭7 → mixolydien (bloc B) → lydien ♭7', couleur: 'Électricité qui reste, doubles croches syncopées', instruments: 'Bornes de batterie, radio, transformateur, ronflement sur la (55 Hz) · basse analogique · Rhodes, nappe · synthé lead' },
    mecanistes: { mode: 'Ré mixolydien → mixolydien ♭6 (bloc B) → mixolydien', couleur: 'Atelier de bois et de cordes, 3+3+2', instruments: 'Chaîne et roue libre de vélo, bois · violoncelle · guitare acoustique, rayons pincés · violon' }
  };
})();
