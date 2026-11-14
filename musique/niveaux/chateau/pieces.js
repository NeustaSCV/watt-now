/* Watt Now? — kit de niveau « Château » : « la chapelle sans prêtre » (musique/niveaux/PROPOSITION.md, validé le 2026-10-09).
   Tonique DO, côté bémols : les lieux du monde d'avant. Do mineur harmonique (la couleur « fantaisie » commune aux familles)
   avec l'accord napolitain (ré♭ majeur) : ancien, presque baroque. Les voix avancent en quintes parallèles (organum) :
   du chant d'église sans paroles. Pierre, froid, réverbération immense.

   RÈGLE DU KIT : la musique de base (cordes, flûte, harpe, percussions de bois et de fer) est NEUTRE et tient seule ;
   les sons du lieu (cloche, horloge, vent dans les meurtrières, chaînes, gouttes) sont dans les stems « matiere » et « m-<zone> »,
   remplaçables pour personnaliser un niveau (abbaye, ruine…) sans toucher au reste.

   Profondeur : dehors (cour, remparts : Exploration) → dedans (grande salle) → profond (crypte : presque rien).
   Grille commune : 84 BPM, blocs de 8 mesures + 1 de queue.
   Dépend de esquisses/js/moteur.js, theme-principal/echantillonneur.js, niveaux/chateau/sons.js. */
(function () {
  'use strict';
  const L = window.WattMusique.lib, rnd = L.rnd, E = (...a) => window.WattEchantillons.jouer(...a), S = () => window.WattChateauSons;
  const BPM = 84, TEMPS = 60 / BPM, BAR = 4 * TEMPS, BLOC = 8, DUREE = BLOC * BAR;
  const ZONES = ['dehors', 'dedans', 'profond'];

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
  /* Percussion échantillonnée sans hauteur : le filtre (sur le nom du fichier) choisit l'instrument et le son */
  const INST = [['logDrum', /slitdrum/], ['gong', /gong/], ['metalDivers', /brake/], ['cymbale', /susp/]];
  function P(ctx, G, couche, t, filtre, gain, o) {
    const inst = (INST.find(([, re]) => re.test(filtre.source)) || ['logDrum'])[0];
    E(ctx, G, couche, inst, t, 0, 4, 1, Object.assign({ filtre, gain, send: 0.5 }, o || {}));
  }

  /* La pierre : grande réverbération (7 s dans le grave), départ un peu tardif */
  const MIX = { rt: [7, 5.5, 2.2], predelay: 0.06, verbWet: 0.55, tone: 8500, trim: {}, couches: ['fond', 'matiere', 'basse', 'harmonie', 'melodie'] };

  /* ======================= L'ORGANUM =======================
     [mesure de départ, nombre de mesures, fondamentale, voix] : la fondamentale, sa quinte, l'octave, et la tierce quand il le faut */
  const EXPLO = [
    [[0, 4, 36, [48, 55, 60, 63]], [4, 4, 44, [56, 63, 68, 72]]],                        // do m · la♭
    [[0, 4, 41, [53, 60, 65, 68]], [4, 4, 37, [49, 56, 61, 65]]],                        // fa m · ré♭ (le napolitain)
    [[0, 4, 44, [55, 60, 63, 67]], [4, 4, 43, [50, 55, 59, 62]]],                        // la♭ maj7 · sol (le si♮ du mineur harmonique)
    [[0, 4, 36, [48, 55, 60, 63]], [4, 2, 37, [49, 56, 61, 65]], [6, 2, 43, [50, 55, 59, 62]]]   // do m · ré♭ → sol : la cadence napolitaine, retour au do
  ];
  /* Le plain-chant de la flûte : [temps depuis le début du bloc, note, durée en temps] */
  const CHANT = {
    1: [[4, 67, 2], [6, 68, 2], [8, 67, 3], [11, 65, 1], [12, 63, 4], [20, 65, 2], [22, 61, 4], [26, 60, 6]],      // sol la♭ sol fa mi♭ | fa ré♭ do
    3: [[4, 60, 2], [6, 63, 2], [8, 67, 4], [12, 68, 2], [14, 67, 2], [16, 65, 2], [18, 63, 2], [20, 61, 4], [24, 59, 4], [28, 62, 4]]   // … ré♭, si♮, ré
  };

  function blocExplo(bi) {
    return {
      /* Violoncelles tenus sur la fondamentale, pizzicati lents sur les appuis (la pulsation de la chapelle) */
      basse: (ctx, G) => {
        EXPLO[bi].forEach(([m0, n, r]) => {
          const t0 = 0.02 + m0 * BAR;
          E(ctx, G, 'basse', 'violoncelles', t0 + 0.1, r, n * BAR - 0.8, 0.28, { gain: 0.4, attack: 2.2, release: 2.5, send: 0.45 });
          L.sousBasse(ctx, G, 'basse', t0, r, n * BAR - 0.5, 1, { gain: 0.02, attack: 2, release: 2.5 });
          for (let m = 0; m < n; m++) {
            E(ctx, G, 'basse', 'celloPizz', t0 + m * BAR, r, 1.5, 0.45, { gain: 0.6, send: 0.5 });
            if (bi >= 2) E(ctx, G, 'basse', 'celloPizz', t0 + m * BAR + 2 * TEMPS, r + 7, 1.5, 0.3, { gain: 0.5, send: 0.5 });
          }
        });
      },
      /* L'organum aux cordes, très doux, et ses sons harmoniques (souffle « verre » une octave au-dessus de la voix haute) */
      harmonie: (ctx, G) => {
        EXPLO[bi].forEach(([m0, n, , v], j) => {
          const t0 = 0.02 + m0 * BAR, d = n * BAR + (j === EXPLO[bi].length - 1 ? -1.5 : 0.8);
          v.forEach((m, i) => E(ctx, G, 'harmonie', m < 55 ? 'violoncelles' : 'violons', t0 + i * 0.25, m, d, 0.28, { gain: m < 55 ? 0.9 : 0.8, attack: 2.5, release: 2.8, pan: -0.45 + i * 0.3, send: 0.6 }));
          L.souffleAccorde(ctx, G, 'harmonie', t0 + 0.5, v[v.length - 1] + 12, d, 1, { couleur: 'verre', gain: 0.006, attack: 3, release: 3, pan: 0.4 });
        });
      },
      /* Peu de mélodie : le plain-chant à la flûte (blocs 2 et 4), la harpe qui égrène l'accord (blocs 1 et 3) */
      melodie: (ctx, G) => {
        if (CHANT[bi]) CHANT[bi].forEach(([b, m, du]) => E(ctx, G, 'melodie', 'fluteNV', 0.02 + b * TEMPS, m, du * TEMPS - 0.05, 0.35, { gain: 0.7, attack: 0.15, release: 0.9, send: 0.6, pan: 0.15 }));
        else EXPLO[bi].forEach(([m0, n, , v], j) => [[1, 0], [1, 1.5], [2, 3]].forEach(([m, beat], k) => {
          if (m >= n || (bi + j + k) % 3 === 2) return;
          E(ctx, G, 'melodie', 'harpe', 0.02 + (m0 + m) * BAR + beat * TEMPS, v[(k + j) % v.length] + 12, 3, 0.35, { gain: 0.7, send: 0.65, pan: -0.3 + k * 0.3 });
        }));
      },
      /* MATIÈRE (remplaçable) : la cloche de la chapelle en tête de bloc, le vent dans les meurtrières, le pont-levis */
      matiere: (ctx, G) => {
        const C = S();
        L.jouerSfx(ctx, G, 'matiere', 0.02, C.cloche(ctx, bi % 2 ? 43 : 48, 0.8), { gain: 0.08, pan: -0.5, send: 0.8, lp: 3500 });
        C.sifflement(ctx, G, 'matiere', (bi * 1.7 % 4 + 1) * BAR, bi % 2 ? 79 : 84, 2.5 * BAR, 0.006, 0.6);
        L.vent(ctx, G, 'matiere', 0.02, DUREE - 0.5, 1, { gain: 0.012, center: 700 });
        if (bi === 1) L.chaine(ctx, G, 'matiere', 5.3 * BAR, { gain: 0.025, pan: 0.6 });
        if (bi === 3) L.grincementMetal(ctx, G, 'matiere', 2.4 * BAR, { gain: 0.025, pan: -0.6 });
      }
    };
  }

  /* ======================= LE FOND, PAR ZONE =======================
     Base : des bourdons, avec un trou dans le spectre (≈ 250 Hz – 2 kHz) dedans et dans la crypte, où vivent les râles et les pas.
     Matière : ce que chaque zone a de propre (vent, horloge, gouttes). */
  const FOND = {
    dehors: (bi) => (ctx, G) => {
      L.souffleAccorde(ctx, G, 'fond', 0.02, 36, DUREE - 2, 1, { couleur: 'fond', gain: 0.04, attack: 3.5, release: 3.5, pan: -0.2 });
      L.souffleAccorde(ctx, G, 'fond', 1.5, 43, DUREE - 4, 1, { couleur: 'fond', gain: 0.024, attack: 4, release: 3, pan: 0.3 });
      if (bi === 1) L.souffleAccorde(ctx, G, 'fond', 4 * BAR, 79, 3 * BAR, 1, { couleur: 'verre', gain: 0.006, attack: 4, release: 3, pan: 0.5 });
    },
    dedans: (bi) => (ctx, G) => {
      E(ctx, G, 'fond', 'violoncelles', 0.3, 36, DUREE - 3, 0.18, { gain: 0.3, attack: 4, release: 3, send: 0.7, lp: 260 });
      L.souffleAccorde(ctx, G, 'fond', 0.02, 36, DUREE - 2, 1, { couleur: 'fond', gain: 0.03, attack: 4, release: 3.5 });
      [[1, bi ? 87 : 84, 4], [5, bi ? 83 : 79, 3]].forEach(([m, n, d], i) => L.souffleAccorde(ctx, G, 'fond', m * BAR, n, d * BAR, 1, { couleur: 'verre', gain: 0.007, attack: 3, release: 3, pan: i ? 0.5 : -0.4 }));   // do, sol · mi♭, si♮
    },
    profond: (bi) => (ctx, G) => {
      L.sousBasse(ctx, G, 'fond', 0.02, 36, DUREE - 2, 1, { gain: 0.012, attack: 5, release: 4 });
      L.souffleAccorde(ctx, G, 'fond', (bi ? 4 : 2) * BAR, bi ? 91 : 96, 3 * BAR, 1, { couleur: 'verre', gain: 0.003, attack: 5, release: 4, pan: bi ? -0.3 : 0.3 });
    }
  };
  const FOND_MATIERE = {
    dehors: (bi) => (ctx, G) => {
      const C = S();
      L.vent(ctx, G, 'matiere', 0.02, DUREE - 0.5, 1, { gain: 0.05, center: 600 });
      C.sifflement(ctx, G, 'matiere', (bi ? 3 : 1) * BAR, bi ? 84 : 79, 3 * BAR, 0.013, bi ? -0.6 : 0.6);
      if (bi === 1) L.jouerSfx(ctx, G, 'matiere', 6 * BAR, C.cloche(ctx, 55, 0.5), { gain: 0.06, pan: 0.7, send: 1.1, lp: 1800 });   // la cloche, très loin
      if (bi === 0) L.chaine(ctx, G, 'matiere', 5.1 * BAR, { gain: 0.012, pan: -0.7 });
    },
    dedans: (bi) => (ctx, G) => {
      /* L'horloge de la grande salle : tic et tac sur les temps (elle bat la mesure du lieu), loin dans la salle */
      const C = S(), t1 = C.tic(ctx, true), t2 = C.tic(ctx, false);
      for (let k = 0; k < BLOC * 4; k++) L.jouerSfx(ctx, G, 'matiere', 0.02 + k * TEMPS, k % 2 ? t2 : t1, { gain: 0.11, pan: 0.45, send: 0.5 });
      L.craquementBois(ctx, G, 'matiere', (bi ? 2.6 : 6.2) * BAR, { gain: 0.015 });
      L.vent(ctx, G, 'matiere', 0.02, DUREE - 0.5, 1, { gain: 0.006, center: 250 });
    },
    profond: (bi) => (ctx, G) => {
      [0.7, 2.9, 4.4, 6.6].forEach((m, k) => { if ((k + bi) % 2 === 0 || k === 2) L.goutte(ctx, G, 'matiere', (m + bi * 0.4) * BAR, { gain: 0.05, pan: [-0.6, 0.5, -0.2, 0.7][k] }); });
      if (bi === 1) L.jouerSfx(ctx, G, 'matiere', 3 * BAR, S().cloche(ctx, 48, 0.4), { gain: 0.05, pan: -0.2, send: 1.2, lp: 500 });   // la cloche, à travers la voûte
    }
  };

  /* ======================= TENSION =======================
     Base : tambours de bois en 3 contre 4 qui se resserre (comme partout : le joueur reconnaît « on m'a repéré »), bourdon do-sol.
     Matière : l'horloge passe en croches, une chaîne qu'on frotte. */
  const MIX_T = { rt: [5, 4, 1.8], predelay: 0.03, verbWet: 0.45, tone: 7500, trim: {}, couches: ['rythmique', 'harmonie', 'matiere'] };
  function blocTension(bi) {
    return {
      pulsation: (ctx, G) => {
        for (let m = 0; m < BLOC; m++) {
          const n = bi === 0 ? (m < 4 ? 3 : m < 6 ? 4 : 6) : (m < 2 ? 4 : 6);
          for (let k = 0; k < n; k++) P(ctx, G, 'rythmique', 0.02 + m * BAR + k * BAR / n, k === 0 ? /slitdrum0_mp/ : /slitdrum1_ppp/, k === 0 ? 1.4 : 1, { send: 0.3, lp: 1400 });
        }
      },
      texture: (ctx, G) => {
        L.souffleAccorde(ctx, G, 'harmonie', 0.02, 36, DUREE - 1.5, 1, { couleur: 'fond', gain: 0.05, attack: 1.5, release: 3, pan: -0.2 });
        L.souffleAccorde(ctx, G, 'harmonie', 0.5, 43, DUREE - 2, 1, { couleur: 'fond', gain: 0.03, attack: 3, release: 3, pan: 0.2 });
        E(ctx, G, 'harmonie', 'violons', 4 * BAR, bi ? 74 : 75, 4 * BAR - 1.5, 0.15, { gain: 0.25, attack: 3, release: 2.5, pan: 0.4, send: 0.6 });   // mi♭ puis ré, très haut
      },
      matiere: (ctx, G) => {
        const C = S(), t1 = C.tic(ctx, true), t2 = C.tic(ctx, false);
        for (let k = 0; k < BLOC * 8; k++) L.jouerSfx(ctx, G, 'matiere', 0.02 + k * TEMPS / 2, k % 2 ? t2 : t1, { gain: 0.09 + 0.05 * (k / 64), pan: 0.45, send: 0.4 });
        L.chaine(ctx, G, 'matiere', (bi ? 1.5 : 5.5) * BAR, { gain: 0.03, pan: -0.5 });
      }
    };
  }

  /* ======================= DANGER =======================
     Base : bois et fer, lourds et lents, en 3 contre 2 : le tambour de bois en triolets de blanches, le tambour de frein (fer) sur 1 et 3.
     Basse : trombones graves, do – do – ré♭ – do (le demi-ton du napolitain). « nombre » : la grille se remplit, le gong roule.
     Matière : la cloche fêlée, les chaînes. */
  const MIX_D = { rt: [3.5, 2.8, 1.4], predelay: 0.015, verbWet: 0.35, tone: 9500, trim: {}, couches: ['rythmique', 'basse', 'harmonie', 'nombre', 'matiere'] };
  const DANGER_BASSE = [[0, 36, 2], [2, 36, 1], [3, 37, 1], [4, 36, 3], [7, 43, 1]];   // [temps sur 2 mesures, note, durée]
  function blocDanger(bi) {
    return {
      percussions: (ctx, G) => {
        for (let m = 0; m < BLOC; m++) {
          const t = 0.02 + m * BAR;
          [0, 4 / 3, 8 / 3].forEach((b, k) => P(ctx, G, 'rythmique', t + b * TEMPS, k ? /slitdrum1_ff/ : /slitdrum0_ff/, k ? 1.1 : 1.35, { send: 0.3 }));
          [0, 2].forEach((b) => P(ctx, G, 'rythmique', t + b * TEMPS, /brake_mf/, b ? 0.55 : 0.75, { send: 0.25, pan: b ? 0.3 : -0.3 }));
          if (m % 4 === 0) P(ctx, G, 'rythmique', t, /gong_smack_low/, 0.5, { send: 0.4 });
        }
      },
      basse: (ctx, G) => {
        for (let p = 0; p < BLOC / 2; p++) DANGER_BASSE.forEach(([b, n, du]) => {
          const t = 0.02 + p * 2 * BAR + b * TEMPS, note = bi === 1 && p >= 2 && n === 37 ? 38 : n;   // bloc 2 : le ré♭ monte au ré, la peur ne se résout pas
          E(ctx, G, 'basse', 'trombone', t, note, du * TEMPS - 0.08, 0.55, { gain: 0.45, attack: 0.03, release: 0.3, send: 0.25 });
          L.sousBasse(ctx, G, 'basse', t, note, du * TEMPS - 0.1, 1, { gain: 0.05, attack: 0.02, release: 0.3 });
        });
      },
      stridences: (ctx, G) => {
        [1, 3, 5, 7].forEach((m) => P(ctx, G, 'harmonie', 0.02 + (m + rnd(0.1, 0.5)) * BAR, (m + bi) % 2 ? /gong_scrape/ : /susp_FX_scrape_[12]/, 0.35, { send: 0.5 }));
        L.vent(ctx, G, 'harmonie', 0.02, DUREE - 0.5, 1, { gain: 0.035, center: 2200 });
      },
      nombre: (ctx, G) => {
        for (let m = 0; m < BLOC; m++) {
          const t = 0.02 + m * BAR;
          [1, 3].forEach((b) => P(ctx, G, 'nombre', t + b * TEMPS, /brake_fff/, 0.35, { send: 0.2, pan: b === 1 ? 0.4 : -0.4 }));
          [2 / 3, 2, 10 / 3].forEach((b) => P(ctx, G, 'nombre', t + b * TEMPS, /slitdrum2_mp/, 0.5, { send: 0.25, pan: rnd(-0.6, 0.6) }));
        }
        [0, 4].forEach((m) => P(ctx, G, 'nombre', 0.02 + m * BAR, /gong_roll_medium/, 0.35, { send: 0.5 }));
      },
      matiere: (ctx, G) => {
        const C = S();
        [0, 2, 4, 6].forEach((m) => L.jouerSfx(ctx, G, 'matiere', 0.02 + m * BAR, C.cloche(ctx, m % 4 ? 43 : 36, 1, true), { gain: 0.12, pan: m % 4 ? 0.3 : -0.3, send: 0.6 }));
        [1.5, 5.5].forEach((m) => L.chaine(ctx, G, 'matiere', (m + bi * 0.5) * BAR, { gain: 0.05 }));
      }
    };
  }

  /* ======================= SIGNAUX ======================= */
  async function signal(nom, sr) {
    const sec = { arriveeChateau: 9, butinChateau: 6, sortieChateau: 9 }[nom];
    const ctx = new OfflineAudioContext(2, Math.ceil(sr * sec), sr);
    const G = L.buildGraph(ctx, { couches: ['harmonie', 'melodie', 'matiere'], rt: [6, 4.5, 1.8], predelay: 0.05, verbWet: 0.55, tone: 9000, trim: {} });
    const C = S();
    if (nom === 'arriveeChateau') {        // la grande porte, puis deux coups de cloche, do et sol, et l'organum qui s'ouvre
      L.grincementMetal(ctx, G, 'matiere', 0.05, { gain: 0.08, pan: -0.2 });
      L.jouerSfx(ctx, G, 'matiere', 1.2, C.cloche(ctx, 48, 0.9), { gain: 0.3, send: 0.8, pan: -0.3 });
      L.jouerSfx(ctx, G, 'matiere', 2.6, C.cloche(ctx, 43, 0.8), { gain: 0.25, send: 0.8, pan: 0.3 });
      [36, 43, 48].forEach((m, i) => E(ctx, G, 'harmonie', 'violoncelles', 1.6 + i * 0.4, m, 4, 0.3, { gain: 0.4, attack: 1.5, release: 3, pan: -0.3 + i * 0.3, send: 0.6 }));
    } else if (nom === 'butinChateau') {   // la harpe monte dans le mineur harmonique (do mi♭ sol si do), une cloche aiguë
      [[60, 0], [63, 0.18], [67, 0.36], [71, 0.54], [72, 0.9]].forEach(([m, d], i) => E(ctx, G, 'melodie', 'harpe', 0.05 + d, m, 3, 0.55 - i * 0.04, { gain: 0.9, send: 0.6, pan: -0.3 + i * 0.15 }));
      L.jouerSfx(ctx, G, 'matiere', 0.95, C.cloche(ctx, 72, 0.5), { gain: 0.1, pan: 0.5, send: 0.9 });
      L.souffleAccorde(ctx, G, 'harmonie', 0.3, 48, 2.5, 1, { couleur: 'fond', gain: 0.03, attack: 0.8, release: 2.5 });
    } else if (nom === 'sortieChateau') {  // ré♭ → do : la cadence napolitaine, on est sorti
      [[37, 49, 56, 61, 65], [36, 48, 55, 60, 63]].forEach((acc, j) => acc.forEach((m, i) => E(ctx, G, 'harmonie', m < 55 ? 'violoncelles' : 'violons', 0.1 + j * 2.6 + i * 0.1, m, j ? 3 : 2.3, 0.28, { gain: 0.4, attack: 0.8, release: j ? 3.5 : 1.2, pan: -0.4 + i * 0.2, send: 0.6 })));
      E(ctx, G, 'melodie', 'fluteNV', 2.75, 72, 2.5, 0.35, { gain: 0.7, attack: 0.2, release: 1.5, send: 0.6 });
    }
    return fonduFin(await ctx.startRendering(), 0.5);
  }

  /* ======================= L'HORLOGE (son diégétique) =======================
     L'horloge de la grande salle sonne encore les heures : un carillon de quatre notes (sol mi♭ fa do, en do mineur),
     puis trois coups graves. ≈ 14 s, mono, joué une fois (le jeu le déclenche à l'heure, ou quand on touche au balancier). */
  async function horloge(sr) {
    const sec = 14, ctx = new OfflineAudioContext(1, Math.ceil(sr * sec), sr);
    const G = L.buildGraph(ctx, { couches: ['matiere'], rt: [3.5, 2.8, 1.2], predelay: 0.02, verbWet: 0.35, tone: 9000, trim: {} });
    const C = S();
    [[0, 79], [0.75, 75], [1.5, 77], [2.25, 72], [3.6, 72], [4.35, 77], [5.1, 79], [5.85, 75]].forEach(([t, m]) => L.jouerSfx(ctx, G, 'matiere', 0.1 + t, C.cloche(ctx, m, 0.7), { gain: 0.25, send: 0.3 }));
    [7.6, 9.4, 11.2].forEach((t) => L.jouerSfx(ctx, G, 'matiere', t, C.cloche(ctx, 48, 1), { gain: 0.45, send: 0.35 }));
    const t1 = C.tic(ctx, true), t2 = C.tic(ctx, false);
    for (let k = 0; k * TEMPS < sec - 0.5; k++) L.jouerSfx(ctx, G, 'matiere', 0.1 + k * TEMPS, k % 2 ? t2 : t1, { gain: 0.05, send: 0.2 });
    return fonduFin(await ctx.startRendering(), 1.5);
  }

  /** Toutes les pièces du kit : { pieces, signaux, diegetiques, meta } ; progres(i, n, texte) */
  async function preparer(sr, progres) {
    const pieces = {
      'fond-chateau': { stems: ZONES.concat(ZONES.map((z) => 'm-' + z)), blocs: [{}, {}] },
      'explo-chateau': { stems: ['basse', 'harmonie', 'melodie', 'matiere'], blocs: [{}, {}, {}, {}] },
      'tension-chateau': { stems: ['pulsation', 'texture', 'matiere'], blocs: [{}, {}] },
      'danger-chateau': { stems: ['percussions', 'basse', 'stridences', 'nombre', 'matiere'], blocs: [{}, {}] }
    };
    const T = [], ajoute = (id, bi, stem, mix, couche, fn) => T.push([id + ' ' + (bi + 1) + ', ' + stem, async () => { pieces[id].blocs[bi][stem] = await rendreStem(mix, couche, fn, sr); }]);
    [0, 1].forEach((bi) => {
      ZONES.forEach((z) => { ajoute('fond-chateau', bi, z, MIX, 'fond', FOND[z](bi)); ajoute('fond-chateau', bi, 'm-' + z, MIX, 'matiere', FOND_MATIERE[z](bi)); });
      const Te = blocTension(bi), Da = blocDanger(bi);
      ajoute('tension-chateau', bi, 'pulsation', MIX_T, 'rythmique', Te.pulsation); ajoute('tension-chateau', bi, 'texture', MIX_T, 'harmonie', Te.texture); ajoute('tension-chateau', bi, 'matiere', MIX_T, 'matiere', Te.matiere);
      [['percussions', 'rythmique'], ['basse', 'basse'], ['stridences', 'harmonie'], ['nombre', 'nombre'], ['matiere', 'matiere']].forEach(([s, c]) => ajoute('danger-chateau', bi, s, MIX_D, c, Da[s]));
    });
    [0, 1, 2, 3].forEach((bi) => ['basse', 'harmonie', 'melodie', 'matiere'].forEach((s) => ajoute('explo-chateau', bi, s, MIX, s, blocExplo(bi)[s])));
    const signaux = {}, diegetiques = {};
    ['arriveeChateau', 'butinChateau', 'sortieChateau'].forEach((n) => T.push(['Signal ' + n, async () => { signaux[n] = await signal(n, sr); }]));
    T.push(['Horloge (son diégétique)', async () => { diegetiques['horloge-chateau'] = await horloge(sr); }]);
    for (let i = 0; i < T.length; i++) { if (progres) progres(i, T.length, T[i][0]); await T[i][1](); }
    if (progres) progres(T.length, T.length, 'Prêt');
    const zone = (z, c) => ({ stems: [z, 'm-' + z], cible: c });
    const meta = {
      'fond-chateau': { role: 'Fond château : par zone, un stem de base et un stem de matière (m-<zone>)', tonique: 'do', mode: 'bourdon do-sol ; dedans : do, sol, mi♭, si♮ dans l\'aigu', kit: 'chateau',
        ciblesStems: { dehors: zone('dehors', -26), dedans: zone('dedans', -25), profond: zone('profond', -30) },
        groupesMobile: Object.fromEntries(ZONES.map((z) => [z, [z, 'm-' + z]])) },      // mobile : la matière prémixée avec sa zone (mémoire)
      'explo-chateau': { role: 'Exploration château (zone « dehors » seulement)', tonique: 'do', mode: 'do mineur harmonique, accord napolitain, organum', kit: 'chateau',
        groupesMobile: { mix: ['basse', 'harmonie', 'melodie', 'matiere'] } },
      'tension-chateau': { role: 'Tension (château)', tonique: 'do', mode: 'pulsation 3 contre 4, bourdon do-sol', kit: 'chateau', groupesMobile: { mix: ['pulsation', 'texture', 'matiere'] } },
      'danger-chateau': { role: 'Danger (château) ; stem « nombre » : 3 Éteints ou plus', tonique: 'do', mode: 'do, ré♭ (napolitain), 3 contre 2', kit: 'chateau',
        mesureSans: ['nombre'], groupesMobile: { base: ['percussions', 'basse', 'stridences', 'matiere'], nombre: ['nombre'] } }
    };
    return { pieces, signaux, diegetiques, meta };
  }

  window.WattKitChateau = { preparer, ZONES, instruments: ['violoncelles', 'violons', 'celloPizz', 'fluteNV', 'harpe', 'trombone', 'logDrum', 'gong', 'metalDivers', 'cymbale'], BPM, TEMPS, BAR, DUREE_BLOC: DUREE };
})();
