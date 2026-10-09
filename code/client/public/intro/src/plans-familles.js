/* Watt Now? — intro, partie 3 : ceux qui savaient encore faire. Un bloc du thème principal par famille.
   Chaque scène répond à un gag de la télé : on souffle soi-même sur la braise (le Souffle-Soupe),
   on grimpe soi-même au poteau (le perron mécanique), on recueille la pluie et on cueille sa pomme
   (les arroseurs, la pomme livrée). La lumière a la couleur de la famille (Book 18 §2). */

import { C, nadia, malik, rose, poseBras, pommier } from './dessins.js';
import { groupe, opacite, visible, seg, doux, sortie, lerp, hasard } from './outils.js';
import { MESURE, CHARBONNIERS, VOLTAIQUES, MECANISTES, ENSEMBLE } from './temps.js';

const T = (w = 4) => `stroke="${C.encre}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const BLOC = 8 * MESURE;

/** Ciel de nuit étoilé. */
function cielNuit(graine, n = 70) {
  const r = hasard(graine);
  return `<rect width="1600" height="900" fill="url(#ciel-nuit)"/>` +
    Array.from({ length: n }, () => `<circle cx="${(r() * 1600).toFixed(0)}" cy="${(r() * 520).toFixed(0)}" r="${(0.8 + r() * 1.6).toFixed(1)}" fill="#fff" opacity="${(0.4 + r() * 0.6).toFixed(2)}"/>`).join('');
}

/** Le voile de nuit (assombrit tout ce qui est dessous), puis des halos qui éclairent en mode « écran ». */
const voileNuit = (o = 0.55, couleur = '#0a1024') => `<rect width="1600" height="900" fill="${couleur}" opacity="${o}"/>`;
const halo = (id, x, y, r, grad) => `<circle data-id="${id}" cx="${x}" cy="${y}" r="${r}" fill="url(#${grad})" style="mix-blend-mode:screen"/>`;

/** Des étincelles (ou des braises) : n particules qui montent et retombent depuis (x, y). */
function etincelles(id, n, graine) {
  const r = hasard(graine);
  const parts = Array.from({ length: n }, (_, i) => ({ vx: (r() - 0.5) * 520, vy: -260 - r() * 420, v: r() }));
  const balisage = `<g data-id="${id}">${parts.map((_, i) => `<circle data-id="${id}${i}" r="${(2 + (i % 3)).toFixed(0)}" fill="#ffd27a"/>`).join('')}</g>`;
  return {
    balisage,
    /** u : secondes depuis l'éclat. */
    maj($, x, y, u) {
      parts.forEach((p, i) => {
        const el = $(`${id}${i}`);
        if (!el) return;
        const k = u * (0.7 + p.v * 0.5);
        el.setAttribute('cx', (x + p.vx * k).toFixed(1));
        el.setAttribute('cy', (y + p.vy * k + 900 * k * k).toFixed(1));
        opacite(el, u >= 0 && u < 0.9 ? 1 - u / 0.9 : 0);
      });
    },
  };
}

/** Des flammes : trois langues qui ondulent. */
const flammes = (id) => `<g data-id="${id}">
  <path data-id="${id}a" d="M-50 0 C-60 -60 -20 -90 -10 -150 C10 -100 40 -80 50 0 Z" fill="#ff7a2a"/>
  <path data-id="${id}b" d="M-34 0 C-40 -50 -10 -70 0 -115 C14 -70 34 -50 34 0 Z" fill="#ffb347"/>
  <path data-id="${id}c" d="M-18 0 C-20 -30 -4 -44 2 -70 C10 -40 20 -30 18 0 Z" fill="#fff0b0"/>
</g>`;
function majFlammes($, id, t, s = 1) {
  ['a', 'b', 'c'].forEach((k, i) => {
    const el = $(`${id}${k}`);
    if (el) el.setAttribute('transform', `scale(${(s * (1 + 0.08 * Math.sin(t * (9 + i * 3) + i))).toFixed(3)} ${(s * (1 + 0.16 * Math.sin(t * (7 + i * 4) + i * 2))).toFixed(3)}) skewX(${(Math.sin(t * 5 + i) * 6).toFixed(2)})`);
  });
}

/* ===================================================================== 🔥 Charbonniers, 1 : on souffle soi-même sur la braise */
const braise = {
  debut: CHARBONNIERS - 0.4, fin: CHARBONNIERS + 7.6,
  creer() {
    const souffles = [1.2, 3.1, 5.0];
    const sp = etincelles('sb', 14, 21);
    const { g, $ } = groupe(`
      <rect width="1600" height="900" fill="#05070c"/>
      <g data-id="lueur">${halo('h', 960, 660, 520, 'halo-feu')}</g>
      <g transform="translate(960 700)">
        <ellipse cx="0" cy="18" rx="220" ry="40" fill="#1a1210"/>
        ${[[-120, 6, 80, 22], [-30, 0, 110, 26], [80, 8, 90, 20], [10, -18, 70, 18]].map(([x, y, w, h], i) => `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" rx="${h / 2}" fill="#2a1a12" transform="rotate(${(i - 1.5) * 9} ${x + w / 2} ${y})"/>`).join('')}
        <g data-id="braise">
          <ellipse cx="0" cy="-6" rx="70" ry="22" fill="#7a1f0c"/>
          <ellipse data-id="b1" cx="-14" cy="-10" rx="36" ry="12" fill="#ff6a1a"/>
          <ellipse data-id="b2" cx="12" cy="-8" rx="20" ry="7" fill="#ffd27a"/>
        </g>
        <g data-id="flamme" transform="translate(0 -10)">${flammes('fl')}</g>
      </g>
      ${sp.balisage}
      <g transform="translate(470 470) scale(1.35)">
        <g data-id="visage">
          <path d="M-210 300 C-230 160 -220 40 -160 -40 C-120 -100 -40 -120 30 -100 C60 -90 76 -70 80 -40 C82 -20 92 -6 110 10 C116 16 112 24 100 26 C96 34 104 44 96 50 C100 60 96 70 84 70 C80 90 70 110 40 112 C20 114 0 130 -6 170 L-20 300 Z" fill="#120c0a"/>
          <path data-id="joue" d="M70 46 C92 40 104 50 100 62 C96 72 78 72 70 64 Z" fill="#120c0a"/>
          <path d="M-170 -60 C-120 -120 -10 -130 50 -96 L60 -70 C0 -86 -100 -84 -170 -40 Z" fill="${C.rouge}" opacity="0.85"/>
          <path d="M80 -40 C82 -20 92 -6 110 10 C116 16 112 24 100 26 C96 34 104 44 96 50 C100 60 96 70 84 70 C80 90 70 110 40 112" fill="none" stroke="#ff9a3c" stroke-width="5" stroke-linecap="round" data-id="liseré"/>
        </g>
        <g data-id="air">${[0, 1, 2].map((i) => `<path data-id="air${i}" d="M0 0 C40 10 80 6 120 20" fill="none" stroke="#ffe7c4" stroke-width="4" stroke-linecap="round" opacity="0"/>`).join('')}</g>
      </g>`);
    return {
      g,
      maj(t) {
        // trois souffles : à chaque fois, la braise rougit, quelques étincelles, et la flamme finit par prendre
        let force = 0.25, dernier = -10;
        souffles.forEach((s, i) => {
          const k = seg(t, s, s + 0.5) * (1 - seg(t, s + 0.9, s + 1.6));
          force += k * (0.35 + i * 0.1);
          if (t >= s) dernier = s;
        });
        const prise = seg(t, 5.6, 7.0);
        force = Math.min(1.4, force + prise);
        opacite($('b1'), 0.5 + force * 0.4);
        $('b2').setAttribute('rx', 14 + force * 16);
        $('h').setAttribute('r', 220 + force * 240 + Math.sin(t * 13) * 10);
        opacite($('lueur'), 0.25 + force * 0.4);
        opacite($('flamme'), prise);
        majFlammes($, 'fl', t, 0.3 + prise * 0.9);
        sp.maj($, 960, 690, t - dernier - 0.25);
        // l'air qui sort des lèvres
        for (let i = 0; i < 3; i++) {
          const el = $(`air${i}`);
          const actif = souffles.some((s) => t > s && t < s + 0.9);
          const ph = (t * 3 + i / 3) % 1;
          el.setAttribute('transform', `translate(${110 + ph * 160} ${30 + i * 14 + ph * 20})`);
          opacite(el, actif ? (1 - ph) * 0.8 : 0);
        }
        // les joues se gonflent pendant le souffle
        const gonfle = souffles.some((s) => t > s - 0.2 && t < s + 0.9);
        $('joue').setAttribute('transform', gonfle ? 'translate(-14 -14) scale(1.18)' : 'translate(0 0)');
        // le visage s'éclaire par en dessous
        $('liseré').setAttribute('stroke-opacity', (0.3 + force * 0.5).toFixed(2));
      },
    };
  },
};

/* ===================================================================== 🔥 Charbonniers, 2 : la forge de nuit */
const forge = {
  debut: CHARBONNIERS + 7.6, fin: VOLTAIQUES,
  creer() {
    const sp = etincelles('sf', 22, 33);
    const fumee = Array.from({ length: 6 }, (_, i) => `<circle data-id="fu${i}" r="60" fill="#55505a"/>`).join('');
    const { g, $ } = groupe(`
      ${cielNuit(4)}
      <g data-id="fumee" opacity="0.7">${fumee}</g>
      <path d="M0 520 L120 500 L160 380 L260 380 L300 520 L520 520 L540 300 L620 300 L640 520 L1600 540 V900 H0 Z" fill="#232a3c"/>
      <rect y="700" width="1600" height="200" fill="#2a2a30"/>
      <g transform="translate(470 700)">
        <rect x="-150" y="-170" width="300" height="170" fill="#6b5a4e" ${T(5)}/>
        ${Array.from({ length: 9 }, (_, i) => `<path d="M${-150 + (i % 3) * 100} ${-170 + Math.floor(i / 3) * 57} h100 v57 h-100 Z" fill="none" stroke="#4a3e36" stroke-width="3"/>`).join('')}
        <rect x="-60" y="-420" width="120" height="250" fill="#5d4f45" ${T(5)}/>
        <rect x="-110" y="-150" width="220" height="80" rx="10" fill="#1a0f0a" ${T(4)}/>
        <g transform="translate(0 -80)">${flammes('ff')}</g>
      </g>
      <g transform="translate(860 700)">
        <path d="M-90 -110 H110 C110 -80 70 -70 40 -70 L30 -20 H70 V0 H-50 V-20 H-10 L-20 -70 C-60 -72 -90 -80 -90 -110 Z" fill="#3a3d44" ${T(5)}/>
        <rect x="-10" y="-126" width="70" height="16" rx="4" fill="#ff8a3a" data-id="fer"/>
      </g>
      <g data-id="nadia" transform="translate(800 712) scale(1.25)">${nadia('na', { regard: 1 })}</g>
      ${voileNuit(0.5)}
      <g opacity="0.55">${halo('hf', 470, 580, 520, 'halo-feu')}</g>
      <g opacity="0.7">${halo('hfer', 880, 580, 140, 'halo-feu')}</g>
      <g transform="translate(470 620)">${flammes('ff2')}</g>
      ${sp.balisage}`);
    // le marteau tombe sur le temps fort, toutes les deux pulsations (84 BPM)
    const periode = MESURE / 2;
    return {
      g,
      maj(t, T) {
        majFlammes($, 'ff', t, 1.1); majFlammes($, 'ff2', t + 0.3, 0.9);
        $('hf').setAttribute('r', 500 + Math.sin(t * 11) * 16 + Math.sin(t * 4.3) * 20);
        const phase = ((T - CHARBONNIERS) % periode) / periode;   // 0 = le coup
        const leve = phase < 0.12 ? 1 - phase / 0.12 : seg(phase, 0.45, 0.95);
        poseBras($, 'na', 'd', lerp(-20, -150, doux(leve)), lerp(-80, -40, leve));
        poseBras($, 'na', 'g', -50, -60);
        const depuisCoup = ((T - CHARBONNIERS) % periode);
        sp.maj($, 900, 575, depuisCoup);
        opacite($('hfer'), 0.6 + (1 - seg(depuisCoup, 0, 0.4)) * 0.4);
        for (let i = 0; i < 6; i++) {
          const ph = ((t * 0.08) + i / 6) % 1;
          const el = $(`fu${i}`);
          el.setAttribute('cx', 470 + Math.sin(ph * 6 + i) * 40 + ph * 260);
          el.setAttribute('cy', 270 - ph * 420);
          el.setAttribute('r', 50 + ph * 120);
          opacite(el, Math.sin(ph * Math.PI) * 0.25);
        }
      },
    };
  },
};

/* ===================================================================== ⚡ Voltaïques, 1 : on grimpe soi-même au poteau */
const poteau = {
  debut: VOLTAIQUES, fin: VOLTAIQUES + 11.4,
  creer() {
    const { g, $ } = groupe(`
      ${cielNuit(9, 90)}
      <circle cx="260" cy="170" r="40" fill="#f1ead2" opacity="0.9"/>
      <path d="M0 760 C400 730 1000 780 1600 750 V900 H0 Z" fill="#141b2c"/>
      <g transform="translate(900 0)">
        <rect x="-18" y="110" width="36" height="680" fill="#3e3026" ${T(4)}/>
        ${Array.from({ length: 10 }, (_, i) => `<path d="M-30 ${300 + i * 46} h12 M18 ${323 + i * 46} h12" ${T(6)}/>`).join('')}
        <rect x="-170" y="150" width="340" height="22" fill="#3e3026" ${T(4)}/>
        <circle cx="-150" cy="140" r="9" fill="#9fb3c8" ${T(3)}/><circle cx="150" cy="140" r="9" fill="#9fb3c8" ${T(3)}/>
        <path d="M-150 140 C-500 200 -800 190 -1000 160" fill="none" stroke="#0e1320" stroke-width="5"/>
        <path data-id="filCoupe" d="M150 140 C190 200 200 260 180 320" fill="none" stroke="#0e1320" stroke-width="5"/>
        <path data-id="filRepare" d="M150 140 C500 200 800 190 1000 160" fill="none" stroke="#0e1320" stroke-width="5" opacity="0"/>
      </g>
      ${voileNuit(0.25)}
      <g data-id="malik">${malik('ml', { regard: 1 })}</g>
      <polygon data-id="faisceau" points="0,0 520,-120 520,120" fill="url(#faisceau)" style="mix-blend-mode:screen" opacity="0.8"/>
      ${halo('eclair', 1050, 160, 160, 'halo-lampe')}`);
    return {
      g,
      maj(t) {
        // il monte (prise des mains en alternance), puis il travaille en haut
        const montee = doux(seg(t, 0.3, 6.2));
        const y = lerp(780, 450, montee), x = 860;
        $('malik').setAttribute('transform', `translate(${x} ${y}) scale(1.05)`);
        const pas = Math.sin(t * 5.5) * (montee < 1 ? 1 : 0);
        poseBras($, 'ml', 'd', lerp(-150, -120, (pas + 1) / 2), lerp(-30, -10, (pas + 1) / 2));
        poseBras($, 'ml', 'g', lerp(150, 120, (1 - pas) / 2) * -1 + 0, -20);
        if (montee >= 1) { poseBras($, 'ml', 'd', -120 + Math.sin(t * 8) * 6, -40); poseBras($, 'ml', 'g', 160, 10); }
        // le faisceau de la lampe frontale balaie, puis se fixe sur le fil coupé
        const tete = { x: x + 0, y: y - 268 * 1.05 };
        const vise = montee < 1 ? Math.sin(t * 1.4) * 22 - 10 : lerp(-10, -38, seg(t, 6.2, 7));
        $('faisceau').setAttribute('transform', `translate(${tete.x} ${tete.y}) rotate(${vise})`);
        // la réparation : un éclair blanc, et le fil est rebranché
        const repare = t > 8.3;
        opacite($('filCoupe'), repare ? 0 : 1); opacite($('filRepare'), repare ? 1 : 0);
        const e = t > 8.1 && t < 9.2 ? (1 - seg(t, 8.1, 9.2)) * (0.6 + 0.4 * Math.sin(t * 70)) : 0;
        opacite($('eclair'), e);
        $('eclair').setAttribute('r', 160 + e * 200);
      },
    };
  },
};

/* ===================================================================== ⚡ Voltaïques, 2 : la batterie, l'ampoule, le silence */
const ampoule = {
  debut: VOLTAIQUES + 11.4, fin: MECANISTES,
  creer() {
    const { g, $ } = groupe(`
      ${cielNuit(14, 80)}
      <path d="M0 700 C500 680 1000 720 1600 690 V900 H0 Z" fill="#161d2e"/>
      <g transform="translate(980 700)">
        <path d="M-260 0 V-300 L0 -420 L260 -300 V0 Z" fill="#5a4636" ${T(5)}/>
        <path d="M-280 -290 L0 -440 L280 -290" fill="none" stroke="#3a2c22" stroke-width="22" stroke-linejoin="round"/>
        <g transform="translate(-200 -470) rotate(-16)"><rect width="200" height="110" fill="#23365a" ${T(4)}/><path d="M66 0 V110 M133 0 V110 M0 55 H200" stroke="#5f7fb0" stroke-width="3"/></g>
        <rect x="-150" y="-240" width="170" height="150" fill="#0d1220" ${T(5)}/>
        <path d="M-65 -240 V-90 M-150 -165 H20" ${T(4)}/>
        <rect x="70" y="-190" width="100" height="190" fill="#3a2c22" ${T(4)}/>
        <g transform="translate(-65 -205)"><path d="M0 -40 V-12" stroke="#222" stroke-width="3"/><circle data-id="verre" r="14" fill="#555"/></g>
      </g>
      <g transform="translate(560 720)">
        <rect x="-80" y="-80" width="160" height="80" rx="6" fill="#2b2f36" ${T(4)}/>
        <rect x="-60" y="-96" width="22" height="16" fill="#c8362b" ${T(3)}/><rect x="38" y="-96" width="22" height="16" fill="#1d1d1d" ${T(3)}/>
        <text x="0" y="-30" text-anchor="middle" font-family="'Courier New', monospace" font-weight="700" font-size="22" fill="#e8c547">12 V</text>
        <path d="M-49 -96 C-60 -200 200 -200 340 -200 C400 -200 400 -200 420 -220" fill="none" stroke="#e8772a" stroke-width="7" stroke-linecap="round"/>
      </g>
      <g data-id="malik" transform="translate(720 720) scale(1.05)">${malik('mb', { regard: 1 })}</g>
      ${voileNuit(0.45)}
      <g data-id="lumiere">${halo('lumiereH', 915, 495, 300, 'halo-lampe')}</g>
      <g transform="translate(915 495)"><circle data-id="filament" r="10" fill="#fff" opacity="0"/></g>
      <polygon data-id="faisceau" points="0,0 420,-80 420,80" fill="url(#faisceau)" style="mix-blend-mode:screen" opacity="0.7"/>`);
    return {
      g,
      maj(t) {
        // il serre la pince sur la borne, l'ampoule s'allume, puis il éteint sa lampe frontale
        const branche = t > 2.4;
        poseBras($, 'mb', 'd', lerp(-20, -40, seg(t, 0.4, 2.0)), lerp(-60, -90, seg(t, 0.4, 2.0)));
        poseBras($, 'mb', 'g', 10, -10);
        const allume = branche ? (t < 3.0 ? (Math.sin(t * 50) > 0 ? 1 : 0.3) : 1) : 0;
        opacite($('lumiere'), allume * 0.7);
        opacite($('filament'), allume);
        const lampe = t < 6.0;
        opacite($('faisceau'), lampe ? 0.7 : 0);
        $('faisceau').setAttribute('transform', `translate(${720 + 7} ${720 - 268 * 1.05 - 18}) rotate(${lerp(30, 20, seg(t, 0, 2))})`);
        const pt = $('mb-lampe'); if (pt) pt.lastElementChild.setAttribute('fill', lampe ? '#fffbe8' : '#888');
      },
    };
  },
};

/* ===================================================================== ⚙️ Mécanistes, 1 : la pluie avant l'aube, le moulin, le tonneau */
const moulin = {
  debut: MECANISTES, fin: MECANISTES + 11.4,
  creer() {
    const r = hasard(17);
    const pluie = Array.from({ length: 90 }, () => `<path d="M${(r() * 1700).toFixed(0)} ${(r() * 900).toFixed(0)} l-10 40" stroke="#b9c8da" stroke-width="2.5" stroke-linecap="round" opacity="0.55"/>`).join('');
    const rayons = Array.from({ length: 8 }, (_, i) => `<g transform="rotate(${i * 45})"><path d="M0 0 V-150" ${T(8)}/><rect x="-26" y="-180" width="52" height="40" fill="#7a5a3a" ${T(4)}/></g>`).join('');
    const { g, $ } = groupe(`
      <rect width="1600" height="900" fill="#2c3448"/>
      <path d="M0 640 C400 610 900 660 1600 630 V900 H0 Z" fill="#33402e"/>
      <path d="M1000 900 C1080 780 1250 720 1600 700 V900 Z" fill="#3c5a78"/>
      <g transform="translate(1240 520)">
        <rect x="-60" y="-280" width="300" height="300" fill="#6b5a4e" ${T(5)}/>
        <path d="M-80 -270 L90 -380 L260 -270" fill="#4a3426" ${T(5)}/>
        <g data-id="roue" transform="translate(-60 40)"><circle r="170" fill="none" ${T(10)}/>${rayons}<circle r="22" fill="#3a2c22" ${T(4)}/></g>
      </g>
      <g transform="translate(560 640)">
        <rect x="-160" y="-300" width="320" height="300" fill="#7a6a58" ${T(5)}/>
        <path d="M-200 -290 L0 -420 L200 -290 Z" fill="#4a3426" ${T(5)}/>
        <path d="M-210 -290 H210" stroke="#5d6770" stroke-width="12"/><path d="M190 -290 V-150" stroke="#5d6770" stroke-width="12"/>
        <rect x="-60" y="-210" width="100" height="90" fill="#ffd98a" ${T(4)}/>
        <g transform="translate(190 0)">
          <rect x="-50" y="-120" width="100" height="120" rx="10" fill="#7a4b26" ${T(5)}/>
          <path d="M-50 -90 H50 M-50 -30 H50" stroke="#3a2c22" stroke-width="6"/>
          <rect data-id="eau" x="-44" y="-112" width="88" height="8" fill="#5f8ab0" opacity="0.9"/>
          <g data-id="gouttes">${[0, 1, 2].map((i) => `<ellipse data-id="go${i}" cx="0" cy="0" rx="5" ry="8" fill="#9fd3e0"/>`).join('')}</g>
        </g>
      </g>
      <g data-id="rose" transform="translate(430 650) scale(1.05)">${rose('ro', { regard: 1 })}</g>
      <g data-id="pluie">${pluie}</g>
      ${voileNuit(0.38, '#0d1424')}
      ${halo('fen', 510, 470, 260, 'halo-lanterne')}
      ${halo('lant', 300, 440, 240, 'halo-lanterne')}
      <g transform="translate(300 440)"><path d="M0 -40 V-16" stroke="#222" stroke-width="3"/><rect x="-14" y="-16" width="28" height="36" rx="5" fill="#ffd98a" ${T(3)}/></g>`);
    return {
      g,
      maj(t) {
        $('roue').setAttribute('transform', `translate(-60 40) rotate(${t * 22})`);
        $('pluie').setAttribute('transform', `translate(${-(t * 120) % 40} ${(t * 700) % 80 - 40})`);
        // l'eau monte dans le tonneau
        const niveau = seg(t, 0, 11.4) * 70;
        $('eau').setAttribute('y', -112 + 70 - niveau);
        $('eau').setAttribute('height', 8 + niveau);
        for (let i = 0; i < 3; i++) {
          const ph = (t * 1.6 + i / 3) % 1;
          const el = $(`go${i}`);
          el.setAttribute('cy', -150 + ph * 60 - 140); el.setAttribute('cx', 0);
          opacite(el, ph < 0.9 ? 0.9 : 0);
        }
        // Rose cale le tonneau, puis regarde la roue tourner
        poseBras($, 'ro', 'd', lerp(-40, -10, seg(t, 3, 5)), lerp(-50, 0, seg(t, 3, 5)));
        poseBras($, 'ro', 'g', 10, -20);
        $('lant').setAttribute('r', 240 + Math.sin(t * 7) * 6);
      },
    };
  },
};

/* ===================================================================== ⚙️ Mécanistes, 2 : l'aube, le potager, la pomme cueillie */
const verger = {
  debut: MECANISTES + 11.4, fin: ENSEMBLE,
  creer() {
    const sillons = Array.from({ length: 5 }, (_, i) => `<path d="M${-40 + i * 10} ${720 + i * 34} C400 ${700 + i * 34} 900 ${730 + i * 34} 1640 ${710 + i * 34}" fill="none" stroke="#5a3f2a" stroke-width="10"/>` +
      Array.from({ length: 14 }, (_, k) => `<path d="M${80 + k * 110 + (i % 2) * 50} ${712 + i * 34} q-8 -18 -2 -26 q8 8 2 26 q10 -16 18 -16 q-4 14 -18 16" fill="#7fb352" ${T(1.5)}/>`).join('')).join('');
    const { g, $ } = groupe(`
      <rect width="1600" height="900" fill="url(#ciel-aube)"/>
      <circle data-id="soleil" cx="1200" cy="640" r="70" fill="#ffe2a0"/>
      <path d="M0 600 C300 560 700 620 1000 580 C1300 540 1500 600 1600 590 V900 H0 Z" fill="#5f7a44"/>
      <path d="M0 690 C500 670 1100 700 1600 680 V900 H0 Z" fill="#7a5a3a"/>
      ${sillons}
      ${pommier(980, 690, 1.2, 10, 9)}
      <g data-id="rose" transform="translate(830 700) scale(1.1)">${rose('rv', { regard: 1 })}</g>
      <g data-id="pomme"><circle r="13" fill="${C.rouge}" ${T(2.5)}/><path d="M0 -13 q3 -8 8 -9" ${T(2.5)}/></g>
      <rect data-id="aube" width="1600" height="900" fill="#1a1630" opacity="0.4"/>`);
    return {
      g,
      maj(t) {
        const jour = seg(t, 0, 11);
        $('soleil').setAttribute('cy', lerp(660, 540, jour));
        opacite($('aube'), 0.45 * (1 - jour));
        // elle lève le bras, cueille, met la pomme dans la hotte (derrière l'épaule)
        const cueille = seg(t, 1.5, 3.2), range = seg(t, 4.2, 5.8);
        poseBras($, 'rv', 'd', lerp(lerp(-10, -165, sortie(cueille)), -200, range), lerp(lerp(0, -20, cueille), -60, range));
        poseBras($, 'rv', 'g', 12, -10);
        const main = { x: 830 + 1.1 * 36 + Math.sin(-lerp(lerp(-10, -165, sortie(cueille)), -200, range) * Math.PI / 180) * 100, y: 700 + 1.1 * -198 + Math.cos(lerp(lerp(-10, -165, sortie(cueille)), -200, range) * Math.PI / 180) * 100 * 1.1 };
        const p = $('pomme');
        if (t < 3.2) p.setAttribute('transform', `translate(905 344)`);
        else if (t < 5.8) p.setAttribute('transform', `translate(${main.x.toFixed(1)} ${main.y.toFixed(1)})`);
        opacite(p, t < 5.8 ? 1 : 0);
      },
    };
  },
};

export const PLANS_FAMILLES = [braise, forge, poteau, ampoule, moulin, verger];

export const CARTONS_FAMILLES = [
  [CHARBONNIERS - 0.2, CHARBONNIERS + 3.6, 'Si vous entendez ceci… et si vous savez encore faire un feu…', 'radio'],
  [CHARBONNIERS + 4.2, CHARBONNIERS + 7.4, 'Mais certains savaient encore faire les choses de leurs mains.', 'recit'],
  [CHARBONNIERS + 10.5, CHARBONNIERS + 18, '', 'devise', '<strong>🔥 Les Charbonniers</strong><em>« Le feu ne trahit pas. »</em>'],
  [VOLTAIQUES + 1.2, VOLTAIQUES + 6.4, 'Réparer soi-même. Remettre le courant, fil après fil.', 'recit'],
  [VOLTAIQUES + 12.5, VOLTAIQUES + 19.5, '', 'devise', '<strong>⚡ Les Voltaïques</strong><em>« Le silence est une arme. »</em>'],
  [MECANISTES + 1.2, MECANISTES + 6.6, 'Semer. Recueillir l\'eau de pluie. Faire tourner la roue.', 'recit'],
  [MECANISTES + 12.5, MECANISTES + 19.5, '', 'devise', '<strong>⚙️ Les Mécanistes</strong><em>« Ce qui tourne ne meurt pas. »</em>'],
];

export { BLOC };
