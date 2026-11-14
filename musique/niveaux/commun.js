/* Watt Now? — kits de niveau : ce qu'ils partagent (musique/niveaux/PROPOSITION.md).
   Un kit = Fond à 3 zones (dehors, dedans, profond ; chaque zone : un stem de base + un stem de matière « m-<zone> »),
   Exploration (4 blocs), Tension (2), Danger (2, + stem « nombre »), 3 signaux, 1 son diégétique.
   RÈGLE : la musique de base est neutre ; les sons du lieu sont dans les stems « matiere » / « m-<zone> », remplaçables.
   Grille : 84 BPM, blocs de 8 mesures + 1 mesure de queue. Chaque stem est rendu avec le graphe complet (réverbération comprise).
   Dépend de esquisses/js/moteur.js (WattMusique) et theme-principal/echantillonneur.js (WattEchantillons). */
(function () {
  'use strict';
  const L = window.WattMusique.lib;
  const BPM = 84, TEMPS = 60 / BPM, BAR = 4 * TEMPS, BLOC = 8, DUREE = BLOC * BAR, X = TEMPS / 2;
  const ZONES = ['dehors', 'dedans', 'profond'];
  const E = (...a) => window.WattEchantillons.jouer(...a);

  function fonduFin(buf, sec) {
    const n = Math.floor(sec * buf.sampleRate);
    for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c), L0 = d.length; for (let i = 0; i < n; i++) d[L0 - n + i] *= 1 - i / n; }
    return buf;
  }
  /* Un stem : seule la couche demandée est calculée (couche null : toutes) */
  async function rendreStem(mix, couche, fn, sr) {
    const ctx = new OfflineAudioContext(2, Math.ceil(sr * (BLOC + 1) * BAR), sr);
    const G = L.buildGraph(ctx, Object.assign({}, mix, { seule: couche }));
    fn(ctx, G);
    return fonduFin(await ctx.startRendering(), 0.6);
  }
  /* Percussion échantillonnée sans hauteur : le filtre (sur le nom du fichier) choisit l'instrument et le son */
  const INST = [['logDrum', /slitdrum/], ['gong', /gong/], ['metalDivers', /brake|cowbell|agogo|cabasa|bell_tree|windchimes|sleighbell|Fing|flexatone/], ['cymbale', /susp/], ['boisDivers', /claves|guiro|maraca|ratchet|slapstick|tambourine|vibraslap/], ['triangle', /triangle/]];
  function P(ctx, G, couche, t, filtre, gain, o) {
    const inst = (INST.find(([, re]) => re.test(filtre.source)) || ['logDrum'])[0];
    E(ctx, G, couche, inst, t, 0, 4, 1, Object.assign({ filtre, gain, send: 0.4 }, o || {}));
  }
  /* Un son diégétique en boucle parfaite : on rend deux passages et on garde le second (son début contient la queue du premier). Mono. */
  async function rendreBoucle(sr, sec, mix, fn) {
    const ctx = new OfflineAudioContext(1, Math.ceil(sr * 2 * sec), sr), G = L.buildGraph(ctx, mix);
    [0, sec].forEach((t) => fn(ctx, G, t));
    const tout = await ctx.startRendering(), n = Math.round(sec * sr);
    const buf = new AudioBuffer({ length: n, numberOfChannels: 1, sampleRate: sr });
    buf.copyToChannel(tout.getChannelData(0).subarray(n, 2 * n), 0);
    return buf;
  }
  async function rendreUneFois(sr, sec, mix, fn, canaux) {
    const ctx = new OfflineAudioContext(canaux || 2, Math.ceil(sr * sec), sr), G = L.buildGraph(ctx, mix);
    fn(ctx, G);
    return fonduFin(await ctx.startRendering(), Math.min(1.2, sec * 0.15));
  }
  /* Accords : [mesure de départ, nombre de mesures, fondamentale, voix] → appel f pour chacun */
  const accords = (liste, f) => liste.forEach(([m0, n, r, v], j) => f(0.02 + m0 * BAR, n, r, v, j, liste.length));

  /**
   * Prépare toutes les pièces d'un kit. def :
   *  id, nom, instruments,
   *  fond: { dehors(bi), dedans(bi), profond(bi) } → fn(ctx, G) (couche 'fond'), mixFond : graphe des zones
   *  matiereFond: { dehors(bi), … } → fn(ctx, G) (couche 'matiere')
   *  explo: { stems: [...], mix, bloc(bi) → { stem: fn } } (4 blocs ; couche = nom du stem)
   *  tension: { mix, bloc(bi) → { pulsation, texture, matiere } }, danger: { mix, bloc(bi) → { percussions, basse, stridences, nombre, matiere } }
   *  signaux: { nom: [secondes, fn(ctx, G)] } (couches 'harmonie', 'melodie', 'matiere', 'basse', 'rythmique')
   *  diegetique: [nom, async (sr) → AudioBuffer, { boucle, role }]
   *  modes: { fond, explo, tension, danger }, tonique
   */
  async function preparerKit(def, sr, progres) {
    const id = def.id, pf = 'fond-' + id, pe = 'explo-' + id, pt = 'tension-' + id, pd = 'danger-' + id;
    const pieces = {
      [pf]: { stems: ZONES.concat(ZONES.map((z) => 'm-' + z)), blocs: [{}, {}] },
      [pe]: { stems: def.explo.stems, blocs: [{}, {}, {}, {}] },
      [pt]: { stems: ['pulsation', 'texture', 'matiere'], blocs: [{}, {}] },
      [pd]: { stems: ['percussions', 'basse', 'stridences', 'nombre', 'matiere'], blocs: [{}, {}] }
    };
    const T = [], ajoute = (pid, bi, stem, mix, couche, fn) => T.push([pid + ' ' + (bi + 1) + ', ' + stem, async () => { pieces[pid].blocs[bi][stem] = await rendreStem(mix, couche, fn, sr); }]);
    const mixFond = Object.assign({ couches: ['fond', 'matiere'] }, def.mixFond);
    const mixT = Object.assign({}, def.tension.mix, { couches: ['pulsation', 'texture', 'matiere'] });
    const mixD = Object.assign({}, def.danger.mix, { couches: ['percussions', 'basse', 'stridences', 'nombre', 'matiere'] });
    const mixE = Object.assign({}, def.explo.mix, { couches: def.explo.stems });
    [0, 1].forEach((bi) => {
      ZONES.forEach((z) => { ajoute(pf, bi, z, mixFond, 'fond', def.fond[z](bi)); ajoute(pf, bi, 'm-' + z, mixFond, 'matiere', def.matiereFond[z](bi)); });
      const Te = def.tension.bloc(bi), Da = def.danger.bloc(bi);
      pieces[pt].stems.forEach((s) => ajoute(pt, bi, s, mixT, s, Te[s]));
      pieces[pd].stems.forEach((s) => ajoute(pd, bi, s, mixD, s, Da[s]));
    });
    [0, 1, 2, 3].forEach((bi) => { const B = def.explo.bloc(bi); def.explo.stems.forEach((s) => ajoute(pe, bi, s, mixE, s, B[s])); });
    const signaux = {}, diegetiques = {};
    Object.entries(def.signaux).forEach(([n, [sec, fn]]) => T.push(['Signal ' + n, async () => {
      signaux[n] = await rendreUneFois(sr, sec, { couches: ['basse', 'rythmique', 'harmonie', 'melodie', 'matiere'], rt: [4.5, 3.5, 1.5], predelay: 0.02, verbWet: 0.5, tone: 9000, trim: {} }, fn);
    }]));
    if (def.diegetique) T.push(['Son du lieu : ' + def.diegetique[0], async () => { diegetiques[def.diegetique[0]] = await def.diegetique[1](sr); }]);
    for (let i = 0; i < T.length; i++) { if (progres) progres(i, T.length, T[i][0]); await T[i][1](); }
    if (progres) progres(T.length, T.length, 'Prêt');
    const zone = (z, c) => ({ stems: [z, 'm-' + z], cible: c }), m = def.modes, k = { kit: id, tonique: def.tonique };
    const meta = {
      [pf]: Object.assign({ role: 'Fond ' + def.nom + ' : par zone, un stem de base et un stem de matière (m-<zone>)', mode: m.fond,
        ciblesStems: { dehors: zone('dehors', -26), dedans: zone('dedans', -25), profond: zone('profond', -30) },
        groupesMobile: Object.fromEntries(ZONES.map((z) => [z, [z, 'm-' + z]])) }, k),
      [pe]: Object.assign({ role: 'Exploration ' + def.nom + ' (zone « dehors » seulement)', mode: m.explo, groupesMobile: { mix: def.explo.stems } }, k),
      [pt]: Object.assign({ role: 'Tension (' + def.nom + ')', mode: m.tension, groupesMobile: { mix: ['pulsation', 'texture', 'matiere'] } }, k),
      [pd]: Object.assign({ role: 'Danger (' + def.nom + ') ; stem « nombre » : 3 Éteints ou plus', mode: m.danger, mesureSans: ['nombre'],
        groupesMobile: { base: ['percussions', 'basse', 'stridences', 'matiere'], nombre: ['nombre'] } }, k)
    };
    return { pieces, signaux, diegetiques, meta };
  }

  window.WattKits = { BPM, TEMPS, BAR, BLOC, DUREE, X, ZONES, E, P, fonduFin, rendreStem, rendreBoucle, rendreUneFois, accords, preparerKit };
})();
