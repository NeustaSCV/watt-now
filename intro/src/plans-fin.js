/* Watt Now? — intro, partie 4 : les trois ensemble (l'aube sur la région, le comptoir des Compteurs),
   l'affiche de Watty corrigée au feutre, puis le personnage du joueur sur son terrain, et le titre. */

import { C, VISAGES, poseBras, watty, logo } from './dessins.js';
import { groupe, opacite, seg, doux, sortie, rebond, lerp, hasard } from './outils.js';
import { ENSEMBLE, TITRE } from './temps.js';

const T = (w = 4) => `stroke="${C.encre}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const halo = (id, x, y, r, grad, o = 1) => `<circle data-id="${id}" cx="${x}" cy="${y}" r="${r}" fill="url(#${grad})" opacity="${o}" style="mix-blend-mode:screen"/>`;

/* ===================================================================== 1. La région à l'aube : trois lumières, un comptoir */
const region = {
  debut: ENSEMBLE, fin: ENSEMBLE + 10.6,
  creer() {
    const r = hasard(23);
    const arbres = (n, y0, y1, couleur) => Array.from({ length: n }, () => {
      const x = r() * 1600, y = lerp(y0, y1, r()), s = 0.5 + r() * 0.7;
      return `<path d="M${x.toFixed(0)} ${y.toFixed(0)} l${(-18 * s).toFixed(1)} 0 l${(18 * s).toFixed(1)} ${(-60 * s).toFixed(1)} l${(18 * s).toFixed(1)} ${(60 * s).toFixed(1)} Z" fill="${couleur}"/>`;
    }).join('');
    const voyageur = (id) => `<g data-id="${id}"><circle cy="-30" r="6" fill="#2a2633"/><path d="M-6 -24 L6 -24 L5 0 L-5 0 Z" fill="#2a2633"/></g>`;
    const { g, $ } = groupe(`
      <rect width="1600" height="900" fill="url(#ciel-aube)"/>
      <circle data-id="soleil" cx="800" cy="560" r="80" fill="#ffe2a0" opacity="0.95"/>
      <g data-id="cam">
        <path d="M0 500 C200 440 360 470 520 430 C700 390 900 460 1100 420 C1300 380 1460 430 1600 410 V900 H0 Z" fill="#6c6a8a"/>
        <path d="M0 560 C260 520 500 560 760 530 C1000 500 1300 560 1600 520 V900 H0 Z" fill="#5d6a6a"/>
        ${arbres(26, 540, 600, '#4a5650')}
        <path d="M0 640 C300 600 600 650 900 620 C1200 590 1400 640 1600 620 V900 H0 Z" fill="#56704a"/>
        <path d="M1600 640 C1300 660 1100 700 980 760 C860 820 700 860 520 900 H760 C880 860 1020 800 1140 760 C1300 710 1450 690 1600 680 Z" fill="#8fb8c8" opacity="0.85"/>
        ${arbres(30, 650, 760, '#3f5a3a')}
        <!-- les chemins qui convergent vers le comptoir -->
        <path d="M250 560 C400 640 600 690 800 700 M1350 540 C1200 620 1000 680 800 700 M560 900 C640 820 740 760 800 700" fill="none" stroke="#c9a77a" stroke-width="8" stroke-dasharray="2 14" stroke-linecap="round" opacity="0.9"/>
        <!-- 🔥 la fumée des Charbonniers, à gauche -->
        <g transform="translate(250 560)"><rect x="-24" y="-40" width="48" height="40" fill="#3a2c22"/><path d="M-30 -40 L0 -64 L30 -40 Z" fill="#2a1f18"/>${[0, 1, 2, 3].map((i) => `<circle data-id="fum${i}" r="20" fill="#8a8590"/>`).join('')}</g>
        ${halo('hfeu', 250, 540, 120, 'halo-feu', 0.9)}
        <!-- ⚡ la lampe blanche des Voltaïques, à droite (poste électrique) -->
        <g transform="translate(1350 540)"><path d="M-30 0 L-14 -90 L14 -90 L30 0 M-24 -30 H24 M-18 -60 H18" fill="none" stroke="#2a2633" stroke-width="5"/><rect x="40" y="-34" width="44" height="34" fill="#3a3442"/><rect x="52" y="-26" width="14" height="12" fill="#eef6ff"/></g>
        ${halo('hvolt', 1410, 520, 110, 'halo-lampe', 0.85)}
        <!-- ⚙️ le moulin des Mécanistes, au centre gauche -->
        <g transform="translate(560 600)"><rect x="-24" y="-60" width="48" height="60" fill="#5a4a3a"/><path d="M-30 -60 L0 -84 L30 -60 Z" fill="#3a2c22"/><g data-id="ailes" transform="translate(0 -66)">${[0, 1, 2, 3].map((i) => `<rect x="-5" y="-62" width="10" height="62" fill="#2a2633" transform="rotate(${i * 90})"/>`).join('')}</g></g>
        ${halo('hmeca', 560, 580, 90, 'halo-lanterne', 0.8)}
        <!-- le comptoir des Compteurs, au carrefour -->
        <g transform="translate(800 700)">
          <rect x="-70" y="-70" width="140" height="70" fill="#7a6a58" ${T(3)}/>
          <path d="M-84 -66 L0 -110 L84 -66 Z" fill="${C.canard}" ${T(3)}/>
          <rect x="-52" y="-58" width="104" height="20" fill="${C.creme}" ${T(2)}/>
          <text y="-43" text-anchor="middle" font-family="'Courier New', monospace" font-weight="700" font-size="14" fill="${C.canard}">COMPTOIR</text>
          <rect x="-16" y="-34" width="32" height="34" fill="#3a2c22"/>
          <path d="M60 -70 V-140" ${T(3)}/><path data-id="drapeau" d="M60 -140 L100 -130 L60 -120 Z" fill="${C.jaune}" ${T(2)}/>
        </g>
        ${halo('hcomptoir', 800, 680, 70, 'halo-lanterne', 0.7)}
        ${voyageur('v1')}${voyageur('v2')}${voyageur('v3')}
      </g>`);
    // trois voyageurs (un par famille) marchent vers le comptoir
    const chemins = [
      (k) => [lerp(260, 760, k), lerp(565, 700, Math.pow(k, 0.8))],
      (k) => [lerp(1340, 840, k), lerp(545, 700, Math.pow(k, 0.8))],
      (k) => [lerp(600, 790, k), lerp(880, 705, k)],
    ];
    return {
      g,
      maj(t) {
        const z = 1.12 - 0.12 * doux(seg(t, 0, 10.6));
        $('cam').setAttribute('transform', `translate(800 620) scale(${z}) translate(-800 -620)`);
        $('soleil').setAttribute('cy', lerp(600, 520, seg(t, 0, 10.6)));
        for (let i = 0; i < 4; i++) {
          const ph = (t * 0.12 + i / 4) % 1, el = $(`fum${i}`);
          el.setAttribute('cx', Math.sin(ph * 5 + i) * 10 + ph * 40); el.setAttribute('cy', -70 - ph * 220); el.setAttribute('r', 14 + ph * 40);
          opacite(el, Math.sin(ph * Math.PI) * 0.6);
        }
        $('ailes').setAttribute('transform', `translate(0 -66) rotate(${t * 30})`);
        $('drapeau').setAttribute('transform', `skewY(${Math.sin(t * 3) * 6})`);
        $('hfeu').setAttribute('r', 120 + Math.sin(t * 9) * 6);
        ['v1', 'v2', 'v3'].forEach((v, i) => {
          const k = seg(t, 0.5 + i * 0.6, 10.6) * 0.95;
          const [x, y] = chemins[i](k);
          $(v).setAttribute('transform', `translate(${x.toFixed(1)} ${(y + Math.abs(Math.sin(t * 5 + i)) * -2).toFixed(1)}) scale(${(0.9 + 0.3 * (y - 540) / 340).toFixed(3)})`);
        });
      },
    };
  },
};

/* ===================================================================== 2. L'affiche de Watty, en ruine, corrigée au feutre */
const affiche = {
  debut: ENSEMBLE + 10.6, fin: ENSEMBLE + 16.6,
  creer() {
    const briques = Array.from({ length: 16 }, (_, l) => Array.from({ length: 12 }, (_, c) => `<rect x="${c * 140 - (l % 2) * 70}" y="${l * 58}" width="136" height="54" fill="${(l * 7 + c * 3) % 5 ? '#9a5a44' : '#8a4e3a'}"/>`).join('')).join('');
    const { g, $ } = groupe(`
      <rect width="1600" height="900" fill="#6e3e2e"/>
      ${briques}
      <g data-id="cam">
        <g transform="translate(470 90) rotate(-2)">
          <path d="M0 0 H660 L650 210 L668 330 L640 720 L420 735 L380 700 L300 728 L0 720 Z" fill="#efe2c2" ${T(4)}/>
          <path d="M0 0 H660 V110 H0 Z" fill="#b8564a"/>
          <text x="330" y="75" text-anchor="middle" font-family="Futura, 'Arial Black', sans-serif" font-weight="900" font-size="50" fill="#efe2c2" letter-spacing="3">LA COMPAGNIE</text>
          <g transform="translate(70 150) scale(2.6)" opacity="0.8">${watty('clin')}</g>
          <text x="470" y="330" text-anchor="middle" font-family="Futura, 'Arial Black', sans-serif" font-weight="900" font-size="64" fill="#b8564a" opacity="0.85">TOUJOURS</text>
          <text x="470" y="400" text-anchor="middle" font-family="Futura, 'Arial Black', sans-serif" font-weight="900" font-size="64" fill="#b8564a" opacity="0.85">PLEIN,</text>
          <text x="470" y="520" text-anchor="middle" font-family="Futura, 'Arial Black', sans-serif" font-weight="900" font-size="46" fill="#5a4a3a" opacity="0.8">jamais à plat !</text>
          <path d="M520 560 L660 520 L660 735 L560 735 Z" fill="#9a5a44"/>
          <path d="M80 640 C160 600 260 660 330 620" stroke="#8a7a62" stroke-width="18" opacity="0.25" fill="none"/>
          <circle cx="120" cy="120" r="40" fill="#b3a382" opacity="0.35"/>
        </g>
        <!-- au feutre -->
        <g data-id="g1" transform="translate(800 330) rotate(-7)"><text font-family="'Marker Felt', 'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive" font-size="74" font-weight="700" fill="none" stroke="#1d2a5c" stroke-width="5">WATTY MENT !</text></g>
        <path data-id="barre" d="M520 260 L780 640 M780 260 L520 640" fill="none" stroke="#1d2a5c" stroke-width="12" stroke-linecap="round"/>
        <g transform="translate(620 830) rotate(-4)"><text data-id="g2" font-family="'Marker Felt', 'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive" font-size="78" font-weight="700" fill="#1d2a5c">Réfléchis par toi-même !</text></g>
      </g>
      <rect data-id="lumiere" width="1600" height="900" fill="#ffcf8a" opacity="0.18" style="mix-blend-mode:screen"/>`);
    const longueurBarre = 2 * Math.hypot(260, 380);
    $('barre').setAttribute('stroke-dasharray', `${longueurBarre / 2} ${longueurBarre / 2}`);
    return {
      g,
      maj(t) {
        $('cam').setAttribute('transform', `translate(800 450) scale(${1.02 + t * 0.012}) translate(-800 -450)`);
        // « Watty ment ! » se trace, puis la croix, puis « Réfléchis par toi-même ! »
        const a = seg(t, 0.5, 2.0);
        const g1 = $('g1').firstElementChild;
        g1.setAttribute('stroke-dasharray', '1400'); g1.setAttribute('stroke-dashoffset', (1400 * (1 - a)).toFixed(0));
        g1.setAttribute('fill', a >= 1 ? '#1d2a5c' : 'none');
        const b = seg(t, 2.1, 2.9);
        const l = longueurBarre / 2;
        $('barre').setAttribute('stroke-dasharray', `${(l * b).toFixed(0)} ${l * 4}`);
        opacite($('barre'), b > 0 ? 0.85 : 0);
        opacite($('g2'), seg(t, 3.2, 3.9));
        $('g2').setAttribute('transform', `translate(${(1 - sortie(seg(t, 3.2, 3.9))) * -20} 0)`);
      },
    };
  },
};

/* ===================================================================== 3. Toi, sur ton terrain, au petit matin — puis le titre */
function terrain(famille) {
  const Visage = VISAGES[famille] || VISAGES.charbonniers;
  return {
    debut: ENSEMBLE + 16.6, fin: TITRE + 100000,
    creer() {
      const r = hasard(41);
      const herbes = Array.from({ length: 70 }, () => { const x = r() * 1600, y = 700 + r() * 200, h = 14 + r() * 22; return `<path d="M${x.toFixed(0)} ${y.toFixed(0)} q-4 ${(-h).toFixed(0)} -10 ${(-h * 1.2).toFixed(0)} M${x.toFixed(0)} ${y.toFixed(0)} q2 ${(-h).toFixed(0)} 8 ${(-h * 1.3).toFixed(0)}" stroke="#4f7a3a" stroke-width="3" fill="none" stroke-linecap="round"/>`; }).join('');
      const brume = Array.from({ length: 5 }, (_, i) => `<ellipse data-id="br${i}" cx="${300 + i * 300}" cy="${640 + (i % 2) * 30}" rx="360" ry="40" fill="#fff4e0" opacity="0.25"/>`).join('');
      const { g, $ } = groupe(`
        <rect width="1600" height="900" fill="url(#ciel-aube)"/>
        <circle data-id="soleil" cx="1180" cy="600" r="90" fill="#ffe6a8"/>
        <g data-id="rayons" opacity="0.18">${Array.from({ length: 10 }, (_, i) => `<path d="M1180 600 L${1180 + Math.cos(i * 0.63 - 2.6) * 1600} ${600 + Math.sin(i * 0.63 - 2.6) * 1600} L${1180 + Math.cos(i * 0.63 - 2.45) * 1600} ${600 + Math.sin(i * 0.63 - 2.45) * 1600} Z" fill="#fff2c8"/>`).join('')}</g>
        <path d="M0 590 C300 560 700 600 1000 570 C1300 540 1500 580 1600 575 V900 H0 Z" fill="#6f7f62"/>
        <path d="M0 650 C400 620 900 660 1600 630 V900 H0 Z" fill="#7aa356"/>
        ${brume}
        <!-- le vieux vélo rouillé, dans l'herbe (Book 21 §5.1.2) -->
        <g transform="translate(1040 790) rotate(-6)">
          <circle cx="-90" cy="0" r="62" fill="none" stroke="#7a4a2a" stroke-width="8"/><circle cx="90" cy="0" r="62" fill="none" stroke="#7a4a2a" stroke-width="8"/>
          <path d="M-90 0 L-20 -80 L60 -80 L90 0 M-20 -80 L0 0 L60 -80 M0 0 L-90 0 M60 -80 L52 -110 H80 M-20 -80 L-30 -104 H-4" fill="none" stroke="#9a5a2e" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="0" cy="0" r="12" fill="#5a3a22"/>
        </g>
        <g data-id="perso" transform="translate(640 820) scale(1.35)">${Visage('toi', { regard: 1 })}</g>
        ${herbes}
        <rect data-id="voileAube" width="1600" height="900" fill="#2a2240" opacity="0.25"/>
        <g data-id="titre" opacity="0">
          <g data-id="logo" transform="translate(800 230)"><g transform="translate(-300 -108) scale(2)">${logo()}</g></g>
          <text data-id="sous" x="800" y="400" text-anchor="middle" font-family="'Avenir Next', sans-serif" font-style="italic" font-weight="600" font-size="44" fill="#fff6e0" stroke="#3b2a1e" stroke-width="6" paint-order="stroke" opacity="0">Et maintenant ?</text>
        </g>`);
      return {
        g,
        maj(t, Tabs) {
          const u = Tabs - TITRE;   // < 0 avant le titre
          $('soleil').setAttribute('cy', lerp(600, 520, seg(t, 0, 12)));
          opacite($('voileAube'), 0.25 * (1 - seg(t, 0, 8)));
          for (let i = 0; i < 5; i++) $(`br${i}`).setAttribute('transform', `translate(${Math.sin(t * 0.2 + i) * 40} 0)`);
          poseBras($, 'toi', 'd', -8, -10);
          poseBras($, 'toi', 'g', 10, 0);
          $('perso').setAttribute('transform', `translate(640 ${820 + Math.sin(t * 1.2) * 1.5}) scale(1.35)`);
          // le titre arrive sur le premier temps de la boucle
          const k = rebond(seg(u, 0, 0.7));
          opacite($('titre'), u >= 0 ? 1 : 0);
          $('logo').setAttribute('transform', `translate(800 230) scale(${Math.max(0.001, k)}) rotate(${(1 - seg(u, 0, 0.7)) * -10})`);
          opacite($('sous'), seg(u, 1.2, 2.2));
        },
      };
    },
  };
}

export const plansFin = (famille) => [region, affiche, terrain(famille)];

const PHRASES = {
  charbonniers: 'Toi, tu sais encore faire un feu.',
  voltaiques: 'Toi, tu sais encore produire ton propre courant.',
  mecanistes: 'Toi, tu sais encore faire pousser de quoi manger.',
};

export const cartonsFin = (famille) => [
  [ENSEMBLE + 0.8, ENSEMBLE + 4.6, 'Le réseau ne reviendra pas.', 'recit'],
  [ENSEMBLE + 5.0, ENSEMBLE + 10.3, 'Le monde s\'est éteint. Ceux qui restent sont ceux qui pensent encore.', 'recit'],
  [ENSEMBLE + 17.4, TITRE - 0.3, PHRASES[famille] || PHRASES.charbonniers, 'toi'],
];
