/* Watt Now? — esquisses des trois thèmes de famille, version 3 « souffle accordé et effets discrets ».
   Grille commune (Book 21 §6.2.1) : 84 BPM, 4/4, tonique ré (terrain). 20 mesures ≈ 57 s.
   Forme : quatre nappes de 4 mesures, séparées par deux silences (mesures 4-5 et 14-15) :
     mesures 0-3 nappe 1 · 4-5 silence · 6-9 nappe 2 · 10-13 nappe 3 (changement de mode) · 14-15 silence · 16-19 coda.
   Plus de mélodie : la nappe est un souffle accordé (bruit filtré sur les notes), sans attaque d'instrument.
   Les effets sont rares, discrets, et jamais calés sur la grille du tempo (décision du brief).
   Notes MIDI : 38 = ré 1 (D2), 50 = ré 2, 62 = ré 3. */
(function () {
  'use strict';

  const BARS = 20;
  /* [mesure de début, durée en mesures, indice d'accord] */
  const SECTIONS = [[0, 4, 0], [6, 4, 1], [10, 4, 2], [16, 4, 3]];
  /* Section qui commence à cette mesure ; si la lecture démarre au milieu (test à l'aveugle), la section en cours */
  function section(b, first) {
    for (const [s, n, c] of SECTIONS) {
      if (b === s) return { c, bars: n, total: n, off: 0, late: false };
      if (first && b > s && b < s + n) return { c, bars: s + n - b, total: n, off: b - s, late: true };
    }
    return null;
  }

  /* Fond terrain, commun aux trois familles : l'air, et un souffle grave sur ré pendant les nappes */
  function fond(ctx, G, b, t, L, bar, first) {
    if (b === 0 || first) L.vent(ctx, G, 'fond', t, (BARS - b) * bar, 1, { gain: 0.016, center: 380 });
    const s = section(b, first);
    if (s) L.souffleAccorde(ctx, G, 'fond', t, 38, s.bars * bar - 1, 1, { couleur: 'fond', gain: 0.03, attack: s.late ? 1.5 : 5, release: 5, pan: -0.15 });
  }

  function faireTheme(def) {
    return {
      id: def.id, nom: def.nom, bpm: 84, bars: BARS, mix: def.mix, def,
      bar(ctx, G, b, t, L, first) {
        const bar = 240 / this.bpm;
        fond(ctx, G, b, t, L, bar, first);
        const s = section(b, first);
        if (s) {
          /* Une nappe tient un accord, ou une suite d'accords à parts égales (« suite ») qui se fondent l'un dans l'autre */
          const parts = def.accords[s.c].suite || [def.accords[s.c]], k = parts.length, per = s.total / k;
          parts.forEach((ch, j) => {
            const a = j * per, e = (j + 1) * per; if (e <= s.off) return;
            const late = s.late && a < s.off, t0 = t + (Math.max(a, s.off) - s.off) * bar;
            const d = (e - Math.max(a, s.off)) * bar + (j < k - 1 ? 1.5 : -1), att = late ? 1.5 : (j ? 2.5 : def.attack), n = ch.v.length;
            ch.v.forEach((m, i) => (L[def.voix || 'souffleAccorde'])(ctx, G, 'harmonie', t0 + (late ? 0 : i * 0.5), m, d, 1,
              Object.assign({ couleur: def.couleur, gain: def.gainNappe, attack: att, release: j < k - 1 ? 3 : 5, pan: -0.5 + i / Math.max(1, n - 1) }, def.voixOpts, { grille: t0 })));
            if (def.ombre) def.ombre(ctx, G, t0, ch, d, att, L);
            L.sousBasse(ctx, G, 'basse', t0 + 0.5, ch.r, d, 1, { gain: 0.12, attack: att + 1, release: j < k - 1 ? 2.5 : 4 });
          });
        }
        if (b === 0 || first) def.lit(ctx, G, t, (BARS - b) * bar, L);
        (def.effets[b] || []).forEach(([frac, nom, o]) => L[nom](ctx, G, 'effets', Math.max(t, t + frac * bar + L.rnd(-0.25, 0.25)), o));
      }
    };
  }

  /* =========================================================
     🔥 CHARBONNIERS — ré dorien → éolien puis touche de ré mineur harmonique (nappe 3) → dorien
     Souffle à partiels métalliques ; lit de braises ; métal qui grince, chaîne, choc lointain, tics de métal qui refroidit.
     ========================================================= */
  const charbonniers = faireTheme({
    id: 'charbonniers', nom: 'Charbonniers', couleur: 'metal', gainNappe: 0.05, attack: 5,
    mix: { rt: [6, 4.5, 1.6], predelay: 0.035, verbWet: 0.55, tone: 7500, trim: { basse: 0.25, rythmique: 4.5, effets: 0.6 } },
    accords: [
      { r: 38, v: [50, 57, 64, 65] },  // Ré m9 (mi-fa en grappe)
      { r: 38, v: [50, 59, 62, 67] },  // Sol / ré : le si♮ dorien
      { suite: [
        { r: 31, v: [53, 58, 62, 69] },  // Sol m9 : le si♭ éolien
        { r: 33, v: [55, 58, 61, 64] }   // La 7♭9 : le do♯ du mineur harmonique, suspendu avant le silence
      ] },
      { r: 38, v: [50, 57, 59, 64] }   // coda : Ré m6/9, retour du si♮
    ],
    ombre(ctx, G, t, ch, d, att, L) { ch.v.slice(-2).forEach((m, i) => L.metalFrotte(ctx, G, 'harmonie', t + 1, m, d - 1, 1, { gain: 0.006, attack: att + 1, release: 5, pan: i ? 0.4 : -0.4 })); },
    lit(ctx, G, t, dur, L) { L.braises(ctx, G, 'rythmique', t, dur, 1, { rate: 2.5, gain: 0.06 }); },
    effets: {
      1: [[0.37, 'ticMetal']], 3: [[0.62, 'chaine']], 4: [[0.21, 'chocLointain']], 5: [[0.48, 'grincementMetal']],
      8: [[0.7, 'ticMetal']], 11: [[0.15, 'grincementMetal']], 12: [[0.83, 'ticMetal']], 14: [[0.33, 'chaine']],
      15: [[0.4, 'chocLointain']], 17: [[0.55, 'ticMetal']], 19: [[0.2, 'chocLointain', { gain: 0.05, lp: 600 }]]
    }
  });

  /* =========================================================
     ⚡ VOLTAÏQUES — ré lydien → si mineur harmonique (nappe 3) → ré lydien
     Onde douce électronique (triangles, filtre fermé, pulsation légère en croches) ; lit de courant secteur ; verre qui tinte, relais, néon qui s'allume, arc électrique.
     ========================================================= */
  const voltaiques = faireTheme({
    id: 'voltaiques', nom: 'Voltaïques', voix: 'ondeDouce', voixOpts: { pulse: 84 / 60 * 2, depth: 0.18, cutoff: 1400, echo: 0.12 }, gainNappe: 0.06, attack: 4,
    mix: { rt: [4.5, 3.8, 2.2], predelay: 0.02, verbWet: 0.45, delay: 3 * 60 / 84 / 2, delayFb: 0.45, tone: 9500, trim: { basse: 0.25, rythmique: 0.8, effets: 1.3 } },
    accords: [
      { r: 38, v: [54, 57, 61, 68] },  // Ré maj7♯11 (fa♯, la, do♯, sol♯) : la lumière lydienne
      { r: 38, v: [50, 56, 59, 64] },  // Mi / ré : le sol♯ en avant
      { suite: [
        { r: 35, v: [54, 59, 62, 70] },  // Si m(maj7) : le la♯ du mineur harmonique
        { r: 42, v: [54, 58, 61, 67] }   // Fa♯ 7♭9 : la seconde augmentée sol–la♯, suspendue avant le silence
      ] },
      { r: 38, v: [50, 57, 61, 68] }   // coda : Ré maj7♯11
    ],
    ombre(ctx, G, t, ch, d, att, L) { L.verreElectrique(ctx, G, 'harmonie', t + 1, ch.v[ch.v.length - 1] + 12, d - 1, 1, { gain: 0.005, attack: att + 1, release: 5, pan: 0.3, echo: 0.2 }); },
    lit(ctx, G, t, dur, L) { L.courant(ctx, G, 'rythmique', t, dur, 1, { gain: 0.022, radio: 0.008 }); },
    effets: {
      1: [[0.44, 'verreTinte']], 2: [[0.8, 'relais']], 4: [[0.3, 'neon']], 5: [[0.6, 'arcElectrique']],
      8: [[0.15, 'verreTinte']], 11: [[0.52, 'relais']], 13: [[0.7, 'verreTinte']], 14: [[0.25, 'arcElectrique']],
      15: [[0.5, 'verreTinte']], 17: [[0.4, 'relais']], 18: [[0.65, 'verreTinte']]
    }
  });

  /* =========================================================
     ⚙️ MÉCANISTES — ré mixolydien → emprunt doux à sol mineur harmonique (nappe 3 : si♭ maj9 → ré majeur) → ré mixolydien
     Flûte grave très légère (souffle presque pur) et carillon de bambou ; lit de feuillage ; oiseaux, gouttes dans un seau, bois qui craque, marteau au loin.
     ========================================================= */
  const mecanistes = faireTheme({
    id: 'mecanistes', nom: 'Mécanistes', couleur: 'flute', gainNappe: 0.05, attack: 3.5,
    mix: { rt: [3.8, 3.2, 1.6], predelay: 0.015, verbWet: 0.42, tone: 8500, trim: { basse: 0.18, rythmique: 2, effets: 0.9 } },
    accords: [
      { r: 38, v: [50, 57, 64] },      // Ré sus2 (ré, la, mi)
      { r: 38, v: [55, 60, 64] },      // Do / ré : le do♮ mixolydien
      { suite: [
        { r: 34, v: [53, 57, 60] },    // Si♭ maj9 (fa, la, do sur si♭) : le si♭ emprunté à sol mineur, chaud et consonant
        { r: 38, v: [54, 57, 62] }     // Ré majeur : le fa♯, dominante de sol mineur harmonique, sans tension ajoutée
      ] },
      { r: 38, v: [54, 57, 64] }       // coda : Ré add9 (fa♯, la, mi), lumineux
    ],
    ombre(ctx, G, t, ch, d, att, L) { L.carillonBambou(ctx, G, 'harmonie', t + 1, d, ch.v, { gain: 0.03, gusts: 2 }); },
    lit(ctx, G, t, dur, L) { L.feuillage(ctx, G, 'rythmique', t, dur, 1, { gain: 0.02, pan: 0.2 }); },
    effets: {
      1: [[0.3, 'oiseau']], 2: [[0.75, 'goutte']], 4: [[0.2, 'marteauBois']], 5: [[0.4, 'oiseau'], [0.85, 'craquementBois']],
      8: [[0.6, 'oiseau']], 11: [[0.25, 'goutte']], 12: [[0.5, 'oiseau']], 14: [[0.3, 'craquementBois']],
      15: [[0.1, 'oiseau']], 17: [[0.45, 'oiseau']], 18: [[0.7, 'marteauBois']]
    }
  });

  window.WattThemes = [charbonniers, voltaiques, mecanistes];
  window.WattThemesInfo = {
    charbonniers: { mode: 'Ré dorien → éolien, puis la 7♭9 du mineur harmonique (nappe 3) → dorien', couleur: 'Forge au repos : souffle à reflets de métal, braises', instruments: 'Nappes : souffle accordé à partiels métalliques, métal frotté en ombre · Texture : braises · Effets : métal qui grince, chaîne, choc lointain, tics de métal qui refroidit' },
    voltaiques: { mode: 'Ré lydien → si mineur harmonique (nappe 3) → ré lydien', couleur: 'Électricité qui reste : onde douce, courant', instruments: 'Nappes : onde douce électronique (triangles, sous-octave, pulsation légère), verre électrique en ombre · Texture : ronflement secteur sur la · Effets : verre qui tinte, relais, néon qui s’allume, arc électrique' },
    mecanistes: { mode: 'Ré mixolydien → emprunt doux à sol mineur harmonique : si♭ maj9 → ré (nappe 3) → ré mixolydien', couleur: 'Ferme-atelier : flûte grave légère, bambou, feuillage', instruments: 'Nappes : flûte grave très légère (souffle accordé), carillon de bambou · Texture : feuillage dans le vent · Effets : oiseaux, gouttes dans un seau, bois qui craque, marteau au loin' }
  };
})();
