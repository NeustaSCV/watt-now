/* Watt Now? — échantillonneur pour les banques libres (VSCO 2 CE, CC0).
   Lit musique/banques/index.json (outils/indexer-banques.py), charge et décode les échantillons,
   joue une note : échantillon le plus proche, transposé ; nuance choisie selon la vélocité ; variantes en alternance.
   Les instruments tenus (cordes, flûte, trombone) peuvent tenir plus longtemps que l'échantillon :
   on enchaîne alors des segments en fondu, sans repasser par l'attaque. Les attaques peuvent être adoucies (nappes).
   Utilisable en direct et en rendu hors ligne (les AudioBuffer décodés servent dans tous les contextes). */
(function () {
  'use strict';
  const L = window.WattMusique.lib;
  const TENUS = new Set(['violonSolo', 'violons', 'violoncelles', 'flute', 'fluteNV', 'trombone']);
  const banque = { index: null, buffers: new Map(), gainInst: {}, rr: {} };

  async function chargerIndex(base) {
    if (!banque.index) banque.index = await (await fetch(base + 'index.json')).json();
    return banque.index;
  }

  /** Charge les instruments demandés (noms de l'index). progres(fait, total) */
  async function charger(ctx, base, noms, progres) {
    const idx = await chargerIndex(base);
    const fichiers = [];
    noms.forEach((n) => (idx[n] || []).forEach((e) => { if (!banque.buffers.has(e.f)) fichiers.push(e.f); }));
    let fait = 0;
    const file = fichiers.slice();
    async function ouvrier() {
      while (file.length) {
        const f = file.shift();
        try {
          const data = await (await fetch(base + f.split('/').map(encodeURIComponent).join('/'))).arrayBuffer();
          banque.buffers.set(f, await ctx.decodeAudioData(data));
        } catch (e) { console.warn('échantillon illisible', f, e); }
        fait++; if (progres) progres(fait, fichiers.length);
      }
    }
    await Promise.all([1, 2, 3, 4, 5, 6].map(ouvrier));
    /* Niveau de référence par instrument : la crête la plus forte de ses fichiers */
    noms.forEach((n) => {
      let pk = 0;
      (idx[n] || []).forEach((e) => { const b = banque.buffers.get(e.f); if (!b) return; for (let c = 0; c < b.numberOfChannels; c++) { const d = b.getChannelData(c); for (let i = 0; i < d.length; i += 4) pk = Math.max(pk, Math.abs(d[i])); } });
      banque.gainInst[n] = pk > 0 ? 0.5 / pk : 1;
    });
  }

  /* Échantillon le plus proche de la note ; nuance selon la vélocité ; alternance des variantes */
  function choisir(inst, midi, vel) {
    const liste = (banque.index[inst] || []).filter((e) => banque.buffers.has(e.f));
    if (!liste.length) return null;
    /* Nuances de la plus douce à la plus forte : pp < p < mp < mf < f < ff ; v1 < v2 < … */
    const RANG = { pp: 0, p: 1, mp: 2, mf: 3, f: 4, ff: 5 };
    const rang = (v) => (v in RANG ? RANG[v] : /^v\d+$/.test(v) ? +v.slice(1) : 0);
    const nuances = [...new Set(liste.map((e) => e.v))].sort((a, b) => rang(a) - rang(b));
    const nu = nuances[Math.min(nuances.length - 1, Math.floor(vel * nuances.length))];
    let cand = liste.filter((e) => e.v === nu);
    if (!cand.length) cand = liste;
    let best = Infinity; cand.forEach((e) => { best = Math.min(best, Math.abs(e.m - midi)); });
    cand = cand.filter((e) => Math.abs(e.m - midi) === best);
    const k = inst + midi; banque.rr[k] = ((banque.rr[k] || 0) + 1) % cand.length;
    return cand[banque.rr[k]];
  }

  /**
   * Joue une note. o : { gain, pan, send, echo, attack, release, offset (s), tenu (force), lp (Hz) }
   * Pour une percussion sans hauteur, midi = 0 et le tirage se fait parmi les variantes (o.n : indice voulu).
   */
  function jouer(ctx, G, couche, inst, t, midi, dur, vel, o) {
    o = Object.assign({ gain: 1, pan: 0, send: 0.4, echo: 0, attack: 0.01, release: 0.5, offset: 0, lp: 0, tenu: TENUS.has(inst) }, o || {});
    let e;
    if (midi === 0) {
      /* Percussion sans hauteur : o.filtre (expression régulière sur le nom du fichier) choisit la famille de sons */
      let l = (banque.index[inst] || []).filter((x) => banque.buffers.has(x.f));
      if (o.filtre) l = l.filter((x) => o.filtre.test(x.f.split('/').pop()));
      if (!l.length) return;
      e = o.n != null ? l[o.n % l.length] : l[Math.floor(Math.random() * l.length)];
    }
    else e = choisir(inst, midi, vel);
    if (!e) return;
    const buf = banque.buffers.get(e.f), rate = midi === 0 ? (o.rate || 1) : Math.pow(2, (midi - e.m) / 12);
    const out = L.voiceOut(ctx, G, couche, o.pan, o.send, o.echo);
    let dest = out;
    if (o.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; f.connect(out); dest = f; }
    const niveau = o.gain * vel * (banque.gainInst[inst] || 1);
    const fin = t + dur;
    /* Enveloppe d'ensemble : attaque (adoucie au besoin), tenue, extinction */
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(niveau, t + Math.max(0.005, o.attack));
    const dispo = (buf.duration - o.offset) / rate;
    if (!o.tenu || dur + o.release <= dispo - 0.2) {
      const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = rate; src.connect(dest);
      src.start(t, o.offset);
      if (o.tenu || o.coupe) {
        out.gain.setValueAtTime(niveau, Math.max(t + o.attack, fin));
        out.gain.linearRampToValueAtTime(0, Math.max(t + o.attack, fin) + o.release);
        src.stop(Math.max(t + o.attack, fin) + o.release + 0.05);
      }
      return;
    }
    /* Note plus longue que l'échantillon : segments enchaînés en fondu (on saute l'attaque dans les suivants) */
    const saut = Math.min(0.8, buf.duration * 0.25), xf = 0.9;
    const segLen = (buf.duration - saut) / rate - 0.3;
    let ts = t, k = 0;
    const total = dur + o.release;
    while (ts < t + total && k < 40) {
      const seg = ctx.createBufferSource(); seg.buffer = buf; seg.playbackRate.value = rate;
      const sg = ctx.createGain(); seg.connect(sg); sg.connect(dest);
      const len = k === 0 ? (buf.duration - o.offset) / rate - 0.3 : segLen;
      sg.gain.setValueAtTime(k === 0 ? 1 : 0, ts);
      if (k > 0) sg.gain.linearRampToValueAtTime(1, ts + xf);
      sg.gain.setValueAtTime(1, ts + len - xf);
      sg.gain.linearRampToValueAtTime(0, ts + len);
      seg.start(ts, k === 0 ? o.offset : saut);
      seg.stop(ts + len + 0.05);
      ts += len - xf; k++;
    }
    out.gain.setValueAtTime(niveau, Math.max(t + o.attack, fin));
    out.gain.linearRampToValueAtTime(0, Math.max(t + o.attack, fin) + o.release);
  }

  window.WattEchantillons = { charger, jouer, banque, chargerIndex };
})();
