/* Watt Now? — esquisses des trois thèmes de famille, version 2 « nappes d'ambiance ».
   Grille commune (Book 21 §6.2.1) : 84 BPM, 4/4, tonique ré (terrain), blocs de 8 mesures.
   Forme : bloc A (8 mesures) + bloc B (8 mesures) + coda (4 mesures) = 20 mesures ≈ 57 s.
   Un accord toutes les 2 mesures ; nappes à attaque lente qui se chevauchent ;
   mélodie réduite à de rares fragments lointains. Notes MIDI : 38 = ré 1 (D2), 50 = ré 2, 62 = ré 3. */
(function () {
  'use strict';

  const BEAT = (bpm) => 60 / bpm;

  /* Fond terrain, commun aux trois familles : ressort frotté sur ré et la, souffle */
  function fond(ctx, G, b, t, L, bpm) {
    if (b === 0 || b === 8 || b === 16) {
      const n = b === 16 ? 4 : 8, d = n * 240 / bpm;
      L.ressortFrotte(ctx, G, 'fond', t, 38, d + 1, 1, { gain: 0.035, pan: -0.2 });
      L.ressortFrotte(ctx, G, 'fond', t + 2, 45, d - 1, 1, { gain: 0.022, pan: 0.25 });
      L.vent(ctx, G, 'fond', t, d, 1, { gain: 0.018, center: 420 });
    }
  }
  /* Accord en cours : un accord toutes les 2 mesures, la coda tient 4 mesures */
  function chord(C, b) { if (b >= 16) return b === 16 ? { c: C[8], bars: 4 } : null; return b % 2 === 0 ? { c: C[b / 2], bars: 2 } : null; }
  function playFragments(L, ctx, G, t, beat, list, o) {
    (list || []).forEach(([m, bt, du]) => L.fragment(ctx, G, 'melodie', t + bt * beat, m, du * beat, 0.8, Object.assign({ pan: L.rnd(-0.4, 0.4) }, o)));
  }

  /* =========================================================
     🔥 CHARBONNIERS — ré dorien → éolien (bloc B) → dorien
     Matière : métal frotté (ressort à lames), braises, enclume au loin.
     ========================================================= */
  const CH = [
    { r: 38, v: [50, 57, 64, 65, 72] },  // Ré m9 (mi-fa en grappe)
    { r: 38, v: [50, 59, 62, 67, 71] },  // Sol / ré : le si♮ dorien
    { r: 34, v: [53, 57, 62, 64, 69] },  // Si♭ maj7♯11
    { r: 33, v: [55, 60, 62, 64, 71] },  // La m11
    { r: 31, v: [53, 58, 62, 65, 69] },  // Sol m9 : le si♭ éolien
    { r: 41, v: [52, 57, 60, 64, 67] },  // Fa maj9
    { r: 34, v: [53, 57, 62, 64, 69] },  // Si♭ maj7♯11
    { r: 33, v: [55, 59, 62, 64, 69] },  // La 7sus4
    { r: 38, v: [50, 57, 59, 64, 65] }   // coda : Ré m6/9, retour du si♮
  ];
  const CH_FRAG = { 2: [[57, 0, 2], [60, 2, 1.5], [59, 3.5, 4]], 10: [[65, 0, 2], [64, 2, 1.5], [62, 3.5, 4]], 17: [[59, 0, 3], [57, 3, 5]] };

  const charbonniers = {
    id: 'charbonniers', nom: 'Charbonniers', bpm: 84, bars: 20,
    mix: { rt: [6, 4.5, 1.6], predelay: 0.035, verbWet: 0.55, tone: 7500, trim: { basse: 0.4, harmonie: 1.25, melodie: 0.6 } },
    bar(ctx, G, b, t, L) {
      const beat = BEAT(this.bpm), bar = 4 * beat;
      fond(ctx, G, b, t, L, this.bpm);
      const ch = chord(CH, b);
      if (ch) {
        const d = ch.bars * bar;
        ch.c.v.forEach((m, i) => L.metalFrotte(ctx, G, 'harmonie', t - 0.6 + i * 0.25, m, d + 0.6, 1, { gain: 0.016, pan: -0.5 + i * 0.25, attack: 3, release: 4.5 }));
        ch.c.v.slice(0, 3).forEach((m, i) => L.nappe(ctx, G, 'harmonie', t - 0.6, m, d + 0.6, 1, { type: 'triangle', voices: 3, spread: 9, cutoff: 650, gain: 0.02, pan: -0.3 + i * 0.3, attack: 3.5, release: 4 }));
        L.grains(ctx, G, 'harmonie', t, d, 'metal', ch.c.v.concat(ch.c.v.map((m) => m + 12)), 2.2, { gain: 0.05, gmin: 0.25, gmax: 0.8 });
        L.sousBasse(ctx, G, 'basse', t, ch.c.r, d, 1, { gain: 0.15, attack: 2, release: 3 });
      }
      /* Texture : braises en continu, l'enclume au loin toutes les 2 mesures */
      if (b === 0 || b === 8 || b === 16) L.braises(ctx, G, 'rythmique', t, (b === 16 ? 4 : 8) * bar, 1, { rate: 4, gain: 0.07 });
      if (b % 2 === 1 && b < 19) L.enclumeLointaine(ctx, G, 'rythmique', t + 2 * beat, 50, 1, { gain: 0.05, pan: 0.45 });
      if (b === 19) L.enclumeLointaine(ctx, G, 'rythmique', t, 38, 1, { gain: 0.07 });
      playFragments(L, ctx, G, t, beat, CH_FRAG[b], { kind: 'souffle', gain: 0.035, send: 0.85, echo: 0 });
    }
  };

  /* =========================================================
     ⚡ VOLTAÏQUES — ré lydien ♭7 → mixolydien (bloc B) → lydien ♭7
     Matière : verre électrique, ronflement secteur sur la (55 Hz), radio, clics de bornes.
     ========================================================= */
  const VO = [
    { r: 38, v: [50, 54, 60, 64, 68] },  // Ré 9♯11 (sol♯, do♮)
    { r: 38, v: [50, 56, 59, 62, 66] },  // Mi 9 / ré
    { r: 36, v: [52, 56, 59, 64, 71] },  // Do maj7♯5
    { r: 35, v: [54, 57, 62, 64, 69] },  // Si m11
    { r: 31, v: [54, 57, 59, 62, 69] },  // Sol maj9 : sol♮, mixolydien
    { r: 40, v: [55, 59, 62, 66, 71] },  // Mi m9
    { r: 34, v: [57, 62, 64, 65, 69] },  // Si♭ maj7♯11 : l'éclat
    { r: 40, v: [56, 62, 66, 71, 74] },  // Mi 9 : retour du sol♯
    { r: 38, v: [50, 54, 60, 64, 68, 74] } // coda : Ré 9♯11
  ];
  const VO_FRAG = { 3: [[76, 0, 2], [80, 2, 4]], 12: [[77, 0, 2], [76, 2, 4]], 18: [[80, 0, 6]] };

  const voltaiques = {
    id: 'voltaiques', nom: 'Voltaïques', bpm: 84, bars: 20,
    mix: { rt: [4.5, 3.8, 2.2], predelay: 0.02, verbWet: 0.45, delay: 3 * 60 / 84 / 2, delayFb: 0.45, tone: 9500, trim: { basse: 0.4, harmonie: 1.3, melodie: 0.85, fond: 1.2 } },
    bar(ctx, G, b, t, L) {
      const beat = BEAT(this.bpm), bar = 4 * beat;
      fond(ctx, G, b, t, L, this.bpm);
      const ch = chord(VO, b);
      if (ch) {
        const d = ch.bars * bar;
        ch.c.v.forEach((m, i) => L.verreElectrique(ctx, G, 'harmonie', t - 0.5 + i * 0.18, m, d + 0.5, 1, { gain: 0.016, pan: -0.55 + i * 0.25, attack: 2.5, release: 4, echo: i === ch.c.v.length - 1 ? 0.25 : 0 }));
        ch.c.v.slice(0, 3).forEach((m, i) => L.nappe(ctx, G, 'harmonie', t - 0.5, m, d + 0.5, 1, { type: 'sawtooth', voices: 4, spread: 16, cutoff: 1100, breathe: 0.45, gain: 0.014, pan: -0.4 + i * 0.4, attack: 3, release: 4 }));
        L.grains(ctx, G, 'harmonie', t, d, 'verre', ch.c.v.map((m) => m + 12), 3, { gain: 0.035, gmin: 0.08, gmax: 0.3, echo: 0.3 });
        L.sousBasse(ctx, G, 'basse', t, ch.c.r, d, 1, { gain: 0.14, attack: 1.8, release: 3 });
      }
      /* Texture : courant continu, clics de bornes rares et en écho */
      if (b === 0 || b === 8 || b === 16) L.courant(ctx, G, 'rythmique', t, (b === 16 ? 4 : 8) * bar, 1, { gain: 0.03, radio: 0.025 });
      if (b < 19) { L.borne(ctx, G, 'rythmique', t + 2.5 * beat, 1, { gain: 0.04, pitch: 2600, pan: 0.4 }); if (b % 2 === 0) L.borne(ctx, G, 'rythmique', t + 3.25 * beat, 0.7, { gain: 0.03, pitch: 3300, pan: -0.4 }); }
      playFragments(L, ctx, G, t, beat, VO_FRAG[b], { kind: 'cloche', gain: 0.04, send: 0.8, echo: 0.4 });
    }
  };

  /* =========================================================
     ⚙️ MÉCANISTES — ré mixolydien → mixolydien ♭6 (bloc B) → mixolydien
     Matière : harmonium trouvé, cordes pincées en grains, vent, bois, roue libre au loin.
     ========================================================= */
  const ME = [
    { r: 38, v: [50, 57, 62, 64, 69] },  // Ré sus2
    { r: 38, v: [50, 55, 60, 64, 67] },  // Do / ré
    { r: 38, v: [50, 55, 59, 62, 67] },  // Sol / ré
    { r: 33, v: [57, 60, 64, 67, 72] },  // La m7
    { r: 31, v: [55, 58, 62, 66, 70] },  // Sol m(maj7) : le si♭
    { r: 34, v: [58, 62, 66, 69, 74] },  // Si♭ maj7♯5 : l'accord rare
    { r: 36, v: [55, 60, 62, 64, 67] },  // Do add9
    { r: 38, v: [50, 55, 57, 62, 67] },  // Ré sus4
    { r: 38, v: [50, 57, 62, 66, 69, 74] } // coda : Ré, retour du si♮
  ];
  const ME_FRAG = { 2: [[81, 0, 3], [78, 2, 3], [74, 4, 4]], 10: [[78, 0, 3], [74, 2, 3], [70, 4, 4]], 17: [[81, 0, 3], [86, 2.5, 5]] };

  const mecanistes = {
    id: 'mecanistes', nom: 'Mécanistes', bpm: 84, bars: 20,
    mix: { rt: [3.8, 3.2, 1.6], predelay: 0.015, verbWet: 0.42, tone: 8500, trim: { basse: 0.4, harmonie: 1.3, rythmique: 1.4, fond: 1.1 } },
    bar(ctx, G, b, t, L) {
      const beat = BEAT(this.bpm), bar = 4 * beat;
      fond(ctx, G, b, t, L, this.bpm);
      const ch = chord(ME, b);
      if (ch) {
        const d = ch.bars * bar;
        ch.c.v.forEach((m, i) => L.harmonium(ctx, G, 'harmonie', t - 0.4 + i * 0.12, m, d + 0.4, 1, { gain: 0.018, pan: -0.45 + i * 0.22, attack: 1.8, release: 3 }));
        L.grains(ctx, G, 'harmonie', t, d, 'bois', ch.c.v.concat(ch.c.v.map((m) => m + 12)), 3.2, { gain: 0.045, gmin: 0.2, gmax: 0.7 });
        L.sousBasse(ctx, G, 'basse', t, ch.c.r, d, 1, { gain: 0.14, attack: 1.5, release: 2.5 });
      }
      /* Texture : vent, bois doux au premier temps, roue libre au loin */
      if (b === 0 || b === 8 || b === 16) L.vent(ctx, G, 'rythmique', t, (b === 16 ? 4 : 8) * bar, 1, { gain: 0.03, center: 750, pan: 0.2 });
      if (b < 19) { L.bois(ctx, G, 'rythmique', t, 55, 1, { gain: 0.05, pan: -0.2 }); if (b % 2 === 1) L.bois(ctx, G, 'rythmique', t + 2.75 * beat, 62, 0.8, { gain: 0.035, pan: 0.3 }); }
      if (b === 7 || b === 15 || b === 19) L.roueLibre(ctx, G, 'rythmique', t + 2 * beat, 1.4, 1, { gain: 0.03 });
      playFragments(L, ctx, G, t, beat, ME_FRAG[b], { kind: 'harmonique', gain: 0.05, send: 0.75, echo: 0 });
    }
  };

  window.WattThemes = [charbonniers, voltaiques, mecanistes];
  window.WattThemesInfo = {
    charbonniers: { mode: 'Ré dorien → éolien (bloc B) → dorien', couleur: 'Chaleur de forge : métal frotté qui scintille, braises, enclume au loin', instruments: 'Nappes : métal frotté (ressort à lames), nappe chaude · Grains : coups de ressort accordés · Texture : braises, enclume lointaine · Fragments : souffle métallique chanté' },
    voltaiques: { mode: 'Ré lydien ♭7 → mixolydien (bloc B) → lydien ♭7', couleur: 'Électricité qui reste : verre électrique, courant, écho', instruments: 'Nappes : verre électrique (FM douce), nappe analogique · Grains : éclats de verre en écho · Texture : ronflement secteur sur la, radio, clics de bornes · Fragments : cloche électrique' },
    mecanistes: { mode: 'Ré mixolydien → mixolydien ♭6 (bloc B) → mixolydien', couleur: 'Atelier de bois : harmonium trouvé, cordes en grains, vent', instruments: 'Nappes : harmonium (deux anches, soufflet) · Grains : cordes pincées accordées · Texture : vent, bois doux, roue libre au loin · Fragments : harmoniques de cordes' }
  };
})();
