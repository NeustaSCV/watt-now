/* Watt Now? — intro, partie 1 : « Abondance TV », la dernière soirée de télé de l'Âge de l'Abondance.
   Zapping entre des programmes où l'on dépense de l'énergie pour des gestes qui n'en demandent aucune.
   Chaque plan : { debut, fin, creer() → { g, maj(t) } }, t en secondes depuis le début du plan. */

import { C, PEAUX, CHEVEUX, personne, poseBras, watty, soleil, nuage, pommier } from './dessins.js';
import { groupe, place, opacite, visible, seg, doux, sortie, rebond, lerp, fenetre, hasard } from './outils.js';
import { TELE_FIN, COUPURE } from './temps.js';

const T = (w = 4) => `stroke="${C.encre}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

/** L'habillage de la chaîne : rubrique en haut à gauche, logo ATV en haut à droite. */
function habillage(rubrique, couleur = C.rouge) {
  return `<g>
    <g transform="translate(40 36)">
      <rect width="${rubrique.length * 21 + 40}" height="50" rx="4" fill="${couleur}" ${T(3)}/>
      <text x="20" y="35" font-family="Futura, 'Avenir Next Condensed', 'Arial Black', sans-serif" font-weight="800" font-size="30" fill="${C.creme}" letter-spacing="1">${rubrique}</text>
    </g>
    <g transform="translate(1450 30)" opacity="0.85">
      <circle cx="50" cy="32" r="30" fill="${C.creme}" ${T(3)}/>
      <text x="50" y="43" text-anchor="middle" font-family="Futura, 'Arial Black', sans-serif" font-weight="900" font-size="28" fill="${C.rouge}">ATV</text>
    </g>
  </g>`;
}

/** Une pièce : mur, plinthe, sol. */
const piece = (mur, sol = '#c9a47a', motif = '') => `
  <rect width="1600" height="900" fill="${mur}"/>${motif}
  <rect y="690" width="1600" height="210" fill="${sol}"/><rect y="682" width="1600" height="12" fill="${C.cremeFonce}" ${T(3)}/>`;

/** Fenêtre avec ciel. */
const fenetreCiel = (x, y, w, h, ciel = 'url(#ciel-jour)') => `
  <g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" fill="${ciel}" ${T(5)}/>
  ${nuage(w * 0.35, h * 0.35, 0.6)}<path d="M${w / 2} 0 V${h} M0 ${h / 2} H${w}" ${T(5)}/>
  <rect x="-14" y="${h}" width="${w + 28}" height="16" fill="${C.cremeFonce}" ${T(3)}/></g>`;

/* ===================================================================== 0. L'allumage et l'habillage de la chaîne */
const allumage = {
  debut: 0, fin: 2.75,
  creer() {
    const rayons = Array.from({ length: 18 }, (_, i) => `<path d="M800 470 L${800 + 1400 * Math.cos((i * 20) * Math.PI / 180)} ${470 + 1400 * Math.sin((i * 20) * Math.PI / 180)} L${800 + 1400 * Math.cos((i * 20 + 10) * Math.PI / 180)} ${470 + 1400 * Math.sin((i * 20 + 10) * Math.PI / 180)} Z" fill="${i % 2 ? '#d94a3a' : C.rouge}"/>`).join('');
    const { g, $ } = groupe(`
      <rect width="1600" height="900" fill="#000"/>
      <g data-id="ident">
        <rect width="1600" height="900" fill="${C.rouge}"/>
        <g data-id="rayons">${rayons}</g>
        <circle cx="800" cy="470" r="260" fill="${C.creme}" ${T(6)}/><circle cx="800" cy="470" r="236" fill="none" stroke="${C.rouge}" stroke-width="4"/>
        <text x="800" y="440" text-anchor="middle" font-family="Futura, 'Arial Black', sans-serif" font-weight="900" font-size="80" textLength="440" lengthAdjust="spacingAndGlyphs" fill="${C.rouge}">ABONDANCE</text>
        <text x="800" y="545" text-anchor="middle" font-family="Futura, 'Arial Black', sans-serif" font-weight="900" font-size="104" fill="${C.encre}">TV</text>
        <g data-id="slogan"><rect x="430" y="760" width="740" height="66" rx="6" fill="${C.creme}" ${T(4)}/>
        <text x="800" y="805" text-anchor="middle" font-family="'Avenir Next', sans-serif" font-style="italic" font-weight="600" font-size="34" fill="${C.canard}">La chaîne qui pense pour vous</text></g>
        <g data-id="watty" transform="translate(1110 300)">${watty('salut')}</g>
      </g>
      <rect data-id="trait" x="0" y="449" width="1600" height="2" fill="#fff"/>`);
    return {
      g,
      maj(t) {
        // le tube s'allume : un trait, qui s'ouvre en image
        const o = seg(t, 0.15, 0.5);
        const trait = $('trait');
        trait.setAttribute('y', 450 - 450 * doux(o));
        trait.setAttribute('height', Math.max(2, 900 * doux(o)));
        opacite(trait, 1 - seg(t, 0.45, 0.75));
        opacite($('ident'), seg(t, 0.35, 0.6));
        place($('rayons'), 800, 470, t * 12, 1); $('rayons').setAttribute('transform', `rotate(${t * 12} 800 470)`);
        const w = rebond(seg(t, 0.6, 1.1));
        $('watty').setAttribute('transform', `translate(${1110 + (1 - w) * 400} 300) rotate(${8 * Math.sin(t * 6)} 70 160)`);
        opacite($('slogan'), seg(t, 0.9, 1.3));
      },
    };
  },
};

/* ===================================================================== 1. Téléachat : le Souffle-Soupe 3000 */
const telachat = {
  debut: 2.75, fin: 8.75,
  creer() {
    const carreaux = Array.from({ length: 12 }, (_, i) => `<path d="M0 ${i * 60} H1600" stroke="#e8c88f" stroke-width="3"/>`).join('') + Array.from({ length: 28 }, (_, i) => `<path d="M${i * 60} 0 V690" stroke="#e8c88f" stroke-width="3"/>`).join('');
    const vapeur = [0, 1, 2].map((i) => `<path data-id="vap${i}" d="M0 0 C-14 -30 14 -50 0 -80 C-14 -110 10 -130 0 -150" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity="0.8"/>`).join('');
    const pales = [0, 1, 2].map((i) => `<path d="M0 0 C30 -20 60 -70 20 -95 C0 -80 -10 -40 0 0 Z" fill="#7fc1cf" ${T(3)} transform="rotate(${i * 120})"/>`).join('');
    const vent = [0, 1, 2, 3].map((i) => `<path data-id="vent${i}" d="M0 0 H-120" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity="0.7"/>`).join('');
    const etoile = Array.from({ length: 16 }, (_, i) => { const a = i * Math.PI / 8, r = i % 2 ? 92 : 128; return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`; }).join(' ');
    const { g, $ } = groupe(`
      ${piece('#f6dfa6', '#c9a47a', carreaux)}
      ${fenetreCiel(120, 140, 300, 260)}
      <g transform="translate(640 712) scale(1.55)">${personne('p', { assis: true, peau: PEAUX[2], haut: '#e46a4f', bas: '#3d4a5c', cheveux: CHEVEUX[0], coiffure: 'boucles', bouche: 'o', regard: 1, outil: `<path d="M0 0 L8 40" ${T(4)}/><ellipse cx="9" cy="46" rx="9" ry="6" fill="${C.metal}" ${T(3)}/>` })}</g>
      <ellipse cx="900" cy="668" rx="150" ry="14" fill="#000" opacity="0.15"/>
      <rect x="160" y="650" width="1300" height="40" rx="6" fill="${C.bois}" ${T(4)}/>
      <path d="M180 662 H1440" stroke="#c8915a" stroke-width="5" stroke-linecap="round"/>
      <rect x="190" y="690" width="1240" height="220" fill="${C.boisFonce}" ${T(4)}/>
      <g transform="translate(900 650) scale(1.25)">
        <g data-id="vapeur" transform="translate(0 -40)">${vapeur}</g>
        <path d="M-90 -50 H90 C90 10 50 20 0 20 C-50 20 -90 10 -90 -50 Z" fill="${C.creme}" ${T(4)}/>
        <ellipse cx="0" cy="-50" rx="90" ry="16" fill="#e0913f" ${T(4)}/>
        <path d="M-60 -30 H60" stroke="${C.rouge}" stroke-width="6"/>
      </g>
      <g transform="translate(1230 650) scale(1.15)">
        <path d="M-70 0 H70 L50 -20 H-50 Z" fill="${C.grisFonce}" ${T(4)}/>
        <rect x="-10" y="-210" width="20" height="200" fill="${C.metal}" ${T(4)}/>
        <g transform="translate(0 -300)">
          <circle r="118" fill="#fff" fill-opacity="0.35" ${T(5)}/>
          <g data-id="pales">${pales}</g>
          <circle r="22" fill="${C.rouge}" ${T(4)}/>
          <g opacity="0.5">${Array.from({ length: 10 }, (_, i) => `<path d="M0 -118 V118" stroke="${C.encre}" stroke-width="2" transform="rotate(${i * 18})"/>`).join('')}</g>
          <circle r="118" fill="none" ${T(5)}/>
        </g>
        <rect x="-110" y="-150" width="220" height="44" rx="6" fill="${C.creme}" ${T(3)}/>
        <text x="0" y="-120" text-anchor="middle" font-family="Futura, 'Arial Black', sans-serif" font-weight="900" font-size="22" fill="${C.rouge}">SOUFFLE-SOUPE 3000</text>
      </g>
      <g data-id="vent" transform="translate(1080 320)">${vent}</g>
      <g data-id="prix" transform="translate(1380 210)">
        <polygon points="${etoile}" fill="${C.jaune}" ${T(4)}/>
        <text y="-14" text-anchor="middle" font-family="Futura, 'Arial Black', sans-serif" font-weight="900" font-size="26" fill="${C.encre}">SEULEMENT</text>
        <text y="22" text-anchor="middle" font-family="Futura, 'Arial Black', sans-serif" font-weight="900" font-size="40" fill="${C.rouge}">900 Wh</text>
        <text y="50" text-anchor="middle" font-family="Futura, 'Arial Black', sans-serif" font-weight="800" font-size="22" fill="${C.encre}">le bol !</text>
      </g>
      ${habillage('TÉLÉACHAT')}`);
    let pose = '';
    return {
      g,
      maj(t) {
        const marche = seg(t, 1.3, 1.9);                 // le ventilateur démarre
        $('pales').setAttribute('transform', `rotate(${(t > 1.3 ? (t - 1.3) * (t - 1.3) * 500 + (t - 1.3) * 900 : 0) % 360})`);
        // la vapeur monte droite, puis le vent la couche vers la gauche
        for (let i = 0; i < 3; i++) {
          const v = $(`vap${i}`), ph = (t * 0.8 + i / 3) % 1;
          v.setAttribute('transform', `translate(${(i - 1) * 40 - marche * 140 * ph} ${-ph * 40}) skewX(${marche * 50}) scale(${1 - ph * 0.3})`);
          opacite(v, (1 - ph) * 0.85 * (1 - marche * 0.6));
        }
        for (let i = 0; i < 4; i++) {
          const ph = (t * 2.2 + i / 4) % 1;
          $(`vent${i}`).setAttribute('transform', `translate(${-ph * 220} ${(i - 1.5) * 50})`);
          opacite($(`vent${i}`), marche * Math.sin(ph * Math.PI) * 0.8);
        }
        // le personnage : bouche en « o » devant la soupe brûlante, puis pouce levé (on change le dessin une fois)
        const p2 = t > 2.6 ? 'content' : 'chaud';
        if (p2 !== pose) {
          pose = p2;
          const tete = $('p-tete');
          tete.querySelectorAll('ellipse,path').forEach((e) => { if (e.getAttribute('fill') === C.rougeFonce || e.dataset.bouche) e.remove(); });
          if (pose === 'content') tete.insertAdjacentHTML('beforeend', `<path data-bouche="1" d="M-4 10 Q8 24 20 10" fill="${C.rougeFonce}" ${T(3)}/>`);
          else tete.insertAdjacentHTML('beforeend', `<ellipse data-bouche="1" cx="7" cy="15" rx="5" ry="6" fill="${C.rougeFonce}" ${T(2)}/>`);
        }
        const leve = sortie(seg(t, 2.6, 3.0));
        poseBras($, 'p', 'd', lerp(-55, -100, leve), lerp(-35, -85, leve));
        poseBras($, 'p', 'g', 20, 60);
        $('p-tete').setAttribute('transform', `translate(0 -250) rotate(${lerp(10, -4, leve)})`);
        const pr = rebond(seg(t, 3.2, 3.7));
        $('prix').setAttribute('transform', `translate(1380 210) scale(${Math.max(0.001, pr)}) rotate(${Math.sin(t * 3) * 4})`);
      },
    };
  },
};

/* ===================================================================== 2. La météo : grand soleil, lancez vos sèche-linge */
const meteo = {
  debut: 8.75, fin: 15,
  creer() {
    const soleils = [[620, 330], [820, 420], [1010, 300], [720, 560], [940, 600]].map(([x, y], i) => `<g data-id="sol${i}" transform="translate(${x} ${y})">${soleil(0, 0, 34)}</g>`).join('');
    const linge = Array.from({ length: 8 }, (_, i) => `<path d="M${330 + i * 70} ${410 + Math.sin(i / 7 * Math.PI) * 30} v22" stroke="${C.boisFonce}" stroke-width="7" stroke-linecap="round"/>`).join('');
    const { g, $ } = groupe(`
      <g data-id="studio">
        <rect width="1600" height="900" fill="${C.canard}"/>
        <g opacity="0.25">${Array.from({ length: 14 }, (_, i) => `<path d="M${i * 120 - 200} 900 L${i * 120 + 300} 0" stroke="#fff" stroke-width="30"/>`).join('')}</g>
        <path d="M480 220 C560 160 700 190 760 160 C860 120 980 150 1060 210 C1150 260 1180 360 1140 450 C1120 540 1160 620 1080 690 C980 760 860 720 760 760 C640 800 520 760 470 670 C420 580 460 500 440 420 C420 330 420 270 480 220 Z" fill="${C.creme}" ${T(5)}/>
        <path d="M540 260 C600 380 560 480 640 560 C700 620 690 700 720 760" fill="none" stroke="#6fb4c7" stroke-width="10" stroke-linecap="round"/>
        <path d="M470 670 C600 700 760 680 900 740" fill="none" stroke="#6fb4c7" stroke-width="16" opacity="0.6"/>
        ${soleils}
        <g transform="translate(1340 900)">${personne('pr', { peau: PEAUX[4], haut: C.rouge, bas: C.encre, cheveux: CHEVEUX[0], coiffure: 'chignon', regard: -1, joues: true })}</g>
      </g>
      <g data-id="jardin">
        <rect width="1600" height="900" fill="url(#ciel-jour)"/>
        <g data-id="grandsoleil">${soleil(250, 170, 90, 'rayons')}</g>
        ${nuage(1250, 130, 0.8)}
        <path d="M0 560 C300 520 700 580 1000 540 C1300 500 1500 540 1600 530 V900 H0 Z" fill="${C.herbe}" ${T(4)}/>
        <path d="M300 640 V330 M900 640 V330" ${T(10)} />
        <path d="M300 640 V330 M900 640 V330" stroke="${C.bois}" stroke-width="6"/>
        <path d="M300 400 Q600 470 900 400" fill="none" ${T(3)}/>
        ${linge}
        <g transform="translate(1000 230)">
          <path d="M0 120 L250 0 L500 120 V560 H0 Z" fill="${C.mur}" ${T(5)}/>
          <path d="M-20 130 L250 -10 L520 130" fill="none" stroke="${C.rouge}" stroke-width="22" stroke-linejoin="round"/>
          <rect x="140" y="200" width="240" height="220" fill="#3a4250" ${T(5)}/>
          <rect x="175" y="250" width="170" height="170" rx="10" fill="${C.creme}" ${T(4)}/>
          <circle cx="260" cy="340" r="58" fill="#5f87a0" ${T(4)}/>
          <g data-id="tambour" transform="translate(260 340)">
            <circle cx="-20" cy="-18" r="18" fill="${C.rouge}"/><circle cx="22" cy="-10" r="16" fill="${C.jaune}"/><circle cx="0" cy="24" r="20" fill="#7fc1cf"/>
          </g>
          <circle cx="260" cy="340" r="58" fill="#cfe9f2" fill-opacity="0.3" ${T(4)}/>
          <circle cx="205" cy="272" r="7" fill="${C.rouge}"/><circle cx="228" cy="272" r="7" fill="#7bd06a"/>
        </g>
      </g>
      ${habillage('MÉTÉO', C.canard)}`);
    return {
      g,
      maj(t) {
        const jardin = t >= 3.15;
        visible($('studio'), !jardin); visible($('jardin'), jardin);
        for (let i = 0; i < 5; i++) {
          const k = rebond(seg(t, 0.3 + i * 0.22, 0.75 + i * 0.22));
          const [x, y] = [[620, 330], [820, 420], [1010, 300], [720, 560], [940, 600]][i];
          $(`sol${i}`).setAttribute('transform', `translate(${x} ${y}) scale(${Math.max(0.001, k)}) rotate(${t * 20})`);
        }
        poseBras($, 'pr', 'g', -130 + Math.sin(t * 2) * 8, -20);
        poseBras($, 'pr', 'd', 10, -20);
        $('rayons') && $('rayons').setAttribute('transform', `rotate(${t * 10})`);
        $('tambour').setAttribute('transform', `translate(260 340) rotate(${t * 400})`);
        $('jardin').setAttribute('transform', `translate(${-(t - 3.15) * 10} 0)`);
      },
    };
  },
};

/* ===================================================================== 3. Tendances : le perron mécanique, la laisse-drone */
const tendances = {
  debut: 15, fin: 21,
  creer() {
    const marches = Array.from({ length: 6 }, (_, i) => `<path data-id="m${i}" d="M0 0 H200" stroke="${C.grisFonce}" stroke-width="4"/>`).join('');
    const file = [[PEAUX[0], '#6b8f3a', 'long', CHEVEUX[3]], [PEAUX[3], C.jaune, 'ras', CHEVEUX[0]], [PEAUX[5], '#8a5aa8', 'gris', CHEVEUX[5]]]
      .map(([peau, haut, coiff, ch], i) => `<g transform="translate(${360 - i * 120} 760) scale(0.95)">${personne(`f${i}`, { peau, haut, coiffure: coiff, cheveux: ch, regard: 1, bouche: i === 1 ? 'plat' : 'sourire', barbe: i === 1 })}</g>`).join('');
    const { g, $ } = groupe(`
      <g data-id="perron">
        <rect width="1600" height="900" fill="url(#ciel-jour)"/>
        <rect x="560" y="80" width="1100" height="700" fill="${C.mur}" ${T(5)}/>
        <rect x="1010" y="230" width="220" height="330" fill="${C.canard}" ${T(5)}/><circle cx="1200" cy="400" r="9" fill="${C.jaune}" ${T(2)}/>
        <rect x="1360" y="230" width="190" height="200" fill="url(#ciel-jour)" ${T(5)}/>
        <rect x="0" y="760" width="1600" height="140" fill="#cdbfa6" ${T(4)}/>
        <path d="M720 760 L1010 560 H1240 V760 Z" fill="${C.metal}" ${T(5)}/>
        <g data-id="marches" transform="translate(730 760)">${marches}</g>
        <path d="M700 700 L990 500 H1020" fill="none" ${T(12)}/><path d="M700 700 L990 500 H1020" fill="none" stroke="#2b2b2b" stroke-width="7"/>
        <rect x="610" y="600" width="250" height="56" rx="6" fill="${C.creme}" ${T(3)} transform="rotate(-4 735 628)"/>
        <text x="735" y="638" text-anchor="middle" font-family="Futura, 'Arial Black', sans-serif" font-weight="900" font-size="24" fill="${C.rouge}" transform="rotate(-4 735 628)">PERRON MÉCANIQUE</text>
        <g data-id="monteur">${personne('mo', { peau: PEAUX[2], haut: C.rouge, coiffure: 'court', cheveux: CHEVEUX[1], regard: 1, lunettes: true })}</g>
        ${file}
      </g>
      <g data-id="rue">
        <rect width="1600" height="900" fill="url(#ciel-jour)"/>
        ${nuage(300, 120, 0.7)}${nuage(1300, 90, 0.5)}
        <rect x="0" y="120" width="1600" height="560" fill="#e9c9a2" ${T(4)}/>
        <rect x="560" y="210" width="480" height="330" fill="#3a4250" ${T(6)}/>
        <rect x="580" y="230" width="440" height="290" fill="#f4e2bd"/>
        <rect x="610" y="390" width="380" height="110" rx="20" fill="${C.canard}" ${T(4)}/>
        <rect x="600" y="360" width="60" height="140" rx="16" fill="${C.canard}" ${T(4)}/><rect x="940" y="360" width="60" height="140" rx="16" fill="${C.canard}" ${T(4)}/>
        <g transform="translate(780 420) scale(0.75)">${personne('pc', { assis: true, peau: PEAUX[1], haut: '#e5a23a', coiffure: 'court', cheveux: CHEVEUX[2], regard: 0 })}</g>
        <path d="M800 210 V540 M560 375 H1040" stroke="#3a4250" stroke-width="10"/>
        <rect x="0" y="680" width="1600" height="220" fill="#b8b0a2" ${T(4)}/>
        <path d="M0 740 H1600" stroke="#9c9486" stroke-width="5" stroke-dasharray="60 40"/>
        <g data-id="chien">
          <g data-id="drone" transform="translate(0 -330)">
            <rect x="-60" y="-14" width="120" height="28" rx="10" fill="${C.grisFonce}" ${T(4)}/>
            <path d="M-60 -14 V-34 M60 -14 V-34" ${T(5)}/>
            <ellipse data-id="h1" cx="-60" cy="-38" rx="44" ry="6" fill="${C.metal}" ${T(3)}/><ellipse data-id="h2" cx="60" cy="-38" rx="44" ry="6" fill="${C.metal}" ${T(3)}/>
            <circle cx="0" cy="0" r="7" fill="#e33"/>
          </g>
          <path data-id="laisse" d="M0 -316 Q-10 -180 -36 -120" fill="none" stroke="${C.rouge}" stroke-width="4"/>
          <g transform="translate(-40 -20)">
            <g data-id="pattes">
              <path data-id="pa1" d="M-50 -40 V0" ${T(12)}/><path data-id="pa2" d="M-30 -40 V0" ${T(12)}/><path data-id="pa3" d="M40 -40 V0" ${T(12)}/><path data-id="pa4" d="M60 -40 V0" ${T(12)}/>
              <path d="M-50 -40 V0 M-30 -40 V0 M40 -40 V0 M60 -40 V0" stroke="#c8873e" stroke-width="7" stroke-linecap="round" opacity="0"/>
            </g>
            <ellipse cx="5" cy="-62" rx="78" ry="38" fill="#c8873e" ${T(4)}/>
            <path data-id="queue" d="M-70 -70 Q-110 -110 -96 -130" fill="none" ${T(9)}/>
            <g transform="translate(78 -96)"><circle r="36" fill="#c8873e" ${T(4)}/><path d="M-20 -26 Q-40 0 -24 18 L-10 -20 Z" fill="#8a5a2a" ${T(3)}/><circle cx="12" cy="-6" r="5" fill="${C.encre}"/><ellipse cx="34" cy="8" rx="9" ry="7" fill="${C.encre}"/><path d="M14 22 Q24 30 30 20" fill="none" ${T(3)}/></g>
            <path d="M48 -78 L64 -84" stroke="${C.rouge}" stroke-width="8"/>
          </g>
        </g>
      </g>
      ${habillage('TENDANCES', '#8a5aa8')}`);
    return {
      g,
      maj(t) {
        const rue = t >= 3.05;
        visible($('perron'), !rue); visible($('rue'), rue);
        if (!rue) {
          for (let i = 0; i < 6; i++) {
            const k = ((t * 0.25 + i / 6) % 1);
            $(`m${i}`).setAttribute('transform', `translate(${k * 290} ${-k * 200})`);
          }
          // le monteur glisse, immobile, sur trois marches (le trajet dure, bien sûr)
          const k = seg(t, 0, 3) * 0.75;
          $('monteur').setAttribute('transform', `translate(${770 + k * 290} ${750 - k * 200}) scale(0.95)`);
          poseBras($, 'mo', 'd', -20, -100); poseBras($, 'mo', 'g', 15, -10);
          for (let i = 0; i < 3; i++) { poseBras($, `f${i}`, 'd', 25, -95); poseBras($, `f${i}`, 'g', -25, 95); }
        } else {
          const u = t - 3.05;
          const x = lerp(-200, 1800, u / 3.0);
          $('chien').setAttribute('transform', `translate(${x} 830)`);
          $('drone').setAttribute('transform', `translate(${Math.sin(u * 3) * 10} ${-330 + Math.sin(u * 5) * 8})`);
          $('h1').setAttribute('rx', 20 + Math.abs(Math.sin(u * 60)) * 26); $('h2').setAttribute('rx', 20 + Math.abs(Math.cos(u * 60)) * 26);
          ['pa1', 'pa2', 'pa3', 'pa4'].forEach((p, i) => $(p).setAttribute('transform', `rotate(${Math.sin(u * 14 + (i % 2) * Math.PI) * 22} ${[-50, -30, 40, 60][i]} -40)`));
          $('queue').setAttribute('transform', `rotate(${Math.sin(u * 16) * 14} -70 -70)`);
          poseBras($, 'pc', 'd', -30 - Math.abs(Math.sin(u * 6)) * 120, -40);   // le maître salue depuis son canapé
          poseBras($, 'pc', 'g', 20, -80);
        }
      },
    };
  },
};

/* ===================================================================== 4. Bien-être : le fauteuil qui nourrit, la montre qui rappelle de cligner */
const bienEtre = {
  debut: 21, fin: 27,
  creer() {
    const { g, $ } = groupe(`
      <g data-id="salon">
        ${piece('#cfe3d6', '#b98d62', Array.from({ length: 30 }, (_, i) => `<path d="M${i * 60} 0 V690" stroke="#bcd5c5" stroke-width="18"/>`).join(''))}
        <rect x="160" y="160" width="300" height="230" fill="${C.ecran}" ${T(6)}/><rect x="180" y="180" width="260" height="190" fill="#4a6a8a"/>
        <path d="M200 340 L270 260 L320 310 L360 270 L420 340 Z" fill="#7fc1cf"/>
        <g transform="translate(860 700)">
          <rect x="-250" y="-330" width="380" height="330" rx="60" fill="#c8362b" ${T(5)}/>
          <rect x="-290" y="-150" width="90" height="170" rx="30" fill="#a82a20" ${T(5)}/>
          <rect x="70" y="-150" width="90" height="170" rx="30" fill="#a82a20" ${T(5)}/>
          <g transform="translate(-60 -110)">${personne('fa', { assis: true, peau: PEAUX[3], haut: '#f0f0f0', bas: '#5a6a7a', coiffure: 'court', cheveux: CHEVEUX[0], barbe: true, regard: -1, bouche: 'o', outil: `<rect x="-26" y="-6" width="52" height="66" rx="6" fill="${C.ecran}" ${T(3)}/><rect x="-20" y="0" width="40" height="52" fill="#9fd3e0"/>`, outilCote: -1 })}</g>
          <g data-id="robot" transform="translate(190 -150)">
            <rect x="-30" y="0" width="60" height="150" fill="${C.metal}" ${T(4)}/>
            <g data-id="r1"><rect x="-14" y="-160" width="28" height="160" rx="12" fill="${C.metal}" ${T(4)}/><circle r="20" fill="${C.grisFonce}" ${T(4)}/>
              <g data-id="r2" transform="translate(0 -160)"><rect x="-12" y="-150" width="24" height="150" rx="10" fill="${C.metal}" ${T(4)}/><circle r="16" fill="${C.grisFonce}" ${T(4)}/>
                <g transform="translate(0 -150)"><circle r="10" fill="${C.rouge}" ${T(3)}/><path d="M0 0 L-34 -8" ${T(5)}/><path d="M-34 -8 l-16 -10 M-34 -8 l-18 -2 M-34 -8 l-16 6" ${T(3)}/><circle cx="-46" cy="-6" r="10" fill="#e0913f" ${T(2)}/></g>
              </g>
            </g>
            <circle cx="0" cy="20" r="8" fill="#7bd06a"/>
          </g>
        </g>
      </g>
      <g data-id="montre">
        <rect width="1600" height="900" fill="#cfe3d6"/>
        <path d="M0 520 C300 470 600 460 900 470 L1600 480 V720 L900 700 C600 700 300 700 0 760 Z" fill="${PEAUX[1]}" ${T(6)}/>
        <rect x="610" y="140" width="380" height="820" rx="40" fill="#2b2b2b" ${T(6)}/>
        <rect x="560" y="290" width="480" height="420" rx="70" fill="#1b1b1b" ${T(7)}/>
        <rect x="590" y="320" width="420" height="360" rx="50" fill="#0e141c"/>
        <g data-id="notif1">
          <circle cx="800" cy="420" r="50" fill="#2c6fd6"/><ellipse cx="800" cy="420" rx="30" ry="18" fill="#fff"/><circle cx="800" cy="420" r="10" fill="#0e141c"/>
          <text x="800" y="530" text-anchor="middle" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="34" fill="#fff">Pensez à cligner</text>
          <text x="800" y="575" text-anchor="middle" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="34" fill="#fff">des yeux</text>
          <rect x="700" y="605" width="200" height="44" rx="22" fill="#2c6fd6"/><text x="800" y="636" text-anchor="middle" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="24" fill="#fff">C'est fait</text>
        </g>
        <g data-id="notif2">
          <text x="800" y="440" text-anchor="middle" font-size="80">🏆</text>
          <text x="800" y="525" text-anchor="middle" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="40" fill="#7bd06a">Bravo !</text>
          <text x="800" y="580" text-anchor="middle" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="32" fill="#fff">12 pas aujourd'hui</text>
          <text x="800" y="625" text-anchor="middle" font-family="'Avenir Next', sans-serif" font-size="24" fill="#9fb1c4">Objectif atteint</text>
        </g>
      </g>
      ${habillage('BIEN-ÊTRE', '#3f8f6a')}`);
    return {
      g,
      maj(t) {
        const montre = t >= 3.3;
        visible($('salon'), !montre); visible($('montre'), montre);
        if (!montre) {
          // le bras robot va et vient de l'assiette (hors champ) à la bouche
          const c = (Math.sin((t - 0.4) * 2.4) + 1) / 2;
          $('r1').setAttribute('transform', `rotate(${lerp(-10, -38, c)})`);
          $('r2').setAttribute('transform', `translate(0 -160) rotate(${lerp(60, -48, c)})`);
          poseBras($, 'fa', 'g', -20, -110);
          poseBras($, 'fa', 'd', 10, -30);
        } else {
          const u = t - 3.3;
          visible($('notif1'), u < 1.35); visible($('notif2'), u >= 1.35);
          $('montre').setAttribute('transform', `translate(800 450) scale(${1 + u * 0.03}) translate(-800 -450)`);
        }
      },
    };
  },
};

/* ===================================================================== 5. Nature & vous : arroseurs sous la pluie, une pomme livrée au pied du pommier */
const nature = {
  debut: 27, fin: TELE_FIN,
  creer() {
    const r = hasard(7);
    const pluie = Array.from({ length: 70 }, () => `<path d="M${(r() * 1700).toFixed(0)} ${(r() * 900).toFixed(0)} l-14 46" stroke="#e8f2f8" stroke-width="3" stroke-linecap="round" opacity="0.8"/>`).join('');
    const jet = (id) => `<g data-id="${id}">${Array.from({ length: 6 }, (_, i) => `<circle cx="${i * 34}" cy="${-i * 30 + i * i * 4}" r="${6 - i * 0.5}" fill="#bfe6f5" ${T(1.5)}/>`).join('')}</g>`;
    const arroseur = (x, id) => `<g transform="translate(${x} 760)"><rect x="-8" y="-40" width="16" height="40" fill="${C.grisFonce}" ${T(3)}/><circle cy="-44" r="10" fill="${C.jaune}" ${T(3)}/><g transform="translate(0 -46)">${jet(id)}</g></g>`;
    const { g, $ } = groupe(`
      <g data-id="pluvieux">
        <rect width="1600" height="900" fill="url(#ciel-pluie)"/>
        ${nuage(300, 110, 1, '#d6dce0')}${nuage(900, 80, 1.2, '#d6dce0')}${nuage(1400, 130, 0.9, '#d6dce0')}
        <path d="M0 600 C400 570 1000 620 1600 590 V900 H0 Z" fill="${C.herbeFonce}" ${T(4)}/>
        ${arroseur(300, 'j1')}${arroseur(780, 'j2')}${arroseur(1260, 'j3')}
        <rect x="1180" y="560" width="220" height="40" rx="6" fill="${C.creme}" ${T(3)}/>
        <text x="1290" y="589" text-anchor="middle" font-family="'Courier New', monospace" font-weight="700" font-size="22" fill="${C.canard}">ARROSAGE 18:00</text>
        <path d="M1290 600 V650" ${T(5)}/>
        <g data-id="pluie">${pluie}</g>
      </g>
      <g data-id="verger">
        <rect width="1600" height="900" fill="url(#ciel-jour)"/>
        ${soleil(1400, 140, 60)}
        <path d="M0 640 C400 600 1000 650 1600 620 V900 H0 Z" fill="${C.herbe}" ${T(4)}/>
        ${pommier(620, 760, 1.25, 12, 5)}
        <g transform="translate(860 790)">${personne('ve', { peau: PEAUX[5], haut: '#7fc1cf', bas: '#5a6a7a', coiffure: 'ras', cheveux: CHEVEUX[0], regard: 1, bouche: 'sourire', outil: `<rect x="-24" y="-10" width="48" height="62" rx="6" fill="${C.ecran}" ${T(3)}/><rect x="-18" y="-4" width="36" height="48" fill="#9fd3e0"/>`, outilCote: 1 })}</g>
        <g data-id="livreur">
          <rect x="-60" y="-14" width="120" height="28" rx="10" fill="${C.grisFonce}" ${T(4)}/>
          <path d="M-60 -14 V-34 M60 -14 V-34" ${T(5)}/>
          <ellipse data-id="l1" cx="-60" cy="-38" rx="44" ry="6" fill="${C.metal}" ${T(3)}/><ellipse data-id="l2" cx="60" cy="-38" rx="44" ry="6" fill="${C.metal}" ${T(3)}/>
          <path d="M0 14 V60" ${T(3)}/>
          <rect x="-50" y="60" width="100" height="80" rx="6" fill="#d9b98c" ${T(4)}/>
          <path d="M-50 84 H50" stroke="${C.rouge}" stroke-width="10"/>
          <text y="128" text-anchor="middle" font-family="Futura, 'Arial Black', sans-serif" font-weight="900" font-size="15" fill="${C.encre}">EXPRESS</text>
          <circle cx="0" cy="44" r="0" fill="${C.rouge}"/>
        </g>
        <g data-id="pomme" opacity="0"><circle r="16" fill="${C.rouge}" ${T(3)}/><path d="M0 -16 q4 -10 10 -12" ${T(3)}/></g>
      </g>
      ${habillage('NATURE & VOUS', C.herbeFonce)}`);
    return {
      g,
      maj(t) {
        const verger = t >= 3.0;
        visible($('pluvieux'), !verger); visible($('verger'), verger);
        if (!verger) {
          $('pluie').setAttribute('transform', `translate(${(t * 90) % 46 * -0.3} ${(t * 900) % 120 - 60})`);
          ['j1', 'j2', 'j3'].forEach((j, i) => $(j).setAttribute('transform', `rotate(${-60 + ((t * 40 + i * 50) % 120)})`));
        } else {
          const u = t - 3.0;
          const d = sortie(seg(u, 0, 1.6));
          $('livreur').setAttribute('transform', `translate(${lerp(1700, 980, d)} ${lerp(180, 430, d) + Math.sin(u * 4) * 6})`);
          $('l1').setAttribute('rx', 20 + Math.abs(Math.sin(u * 60)) * 26); $('l2').setAttribute('rx', 20 + Math.abs(Math.cos(u * 60)) * 26);
          poseBras($, 've', 'd', -20, -120);
          poseBras($, 've', 'g', lerp(0, 160, sortie(seg(u, 1.8, 2.3))), lerp(0, 20, seg(u, 1.8, 2.3)));
          // une pomme tombe de l'arbre, juste à côté
          const ch = seg(u, 1.6, 2.4);
          opacite($('pomme'), u > 1.6 ? 1 : 0);
          $('pomme').setAttribute('transform', `translate(${lerp(700, 760, ch)} ${lerp(470, 770, ch * ch)}) rotate(${ch * 200})`);
        }
      },
    };
  },
};

/* ===================================================================== 6. La réclame de Watty, puis la coupure */
const reclame = {
  debut: TELE_FIN, fin: COUPURE + 2.6,
  creer() {
    const rayons = Array.from({ length: 16 }, (_, i) => { const a = i * Math.PI / 8, b = a + Math.PI / 16; return `<path d="M520 500 L${520 + 1800 * Math.cos(a)} ${500 + 1800 * Math.sin(a)} L${520 + 1800 * Math.cos(b)} ${500 + 1800 * Math.sin(b)} Z" fill="#f8d9a0"/>`; }).join('');
    const { g, $ } = groupe(`
      <rect width="1600" height="900" fill="#000"/>
      <g data-id="ecran">
        <g data-id="image">
          <rect width="1600" height="900" fill="${C.creme}"/>
          <g data-id="rayons">${rayons}</g>
          <rect x="0" y="0" width="1600" height="110" fill="${C.rouge}"/>
          <text x="800" y="76" text-anchor="middle" font-family="Futura, 'Arial Black', sans-serif" font-weight="900" font-size="54" fill="${C.creme}" letter-spacing="6">LA COMPAGNIE PRÉSENTE</text>
          <g data-id="wattyClin" transform="translate(330 220) scale(3.2)">${watty('clin')}</g>
          <g data-id="wattyFige" transform="translate(330 220) scale(3.2)" style="display:none">${watty('fige')}</g>
          <g data-id="watt" transform="translate(1080 400)"><text text-anchor="middle" font-family="Futura, 'Arial Black', sans-serif" font-weight="900" font-size="190" fill="${C.rouge}" stroke="${C.encre}" stroke-width="6" paint-order="stroke">WATT</text></g>
          <g data-id="now" transform="translate(1080 600)"><text text-anchor="middle" font-family="Futura, 'Arial Black', sans-serif" font-weight="900" font-size="190" fill="${C.encre}">NOW?</text></g>
          <g data-id="slogan"><rect x="0" y="770" width="1600" height="130" fill="${C.canard}"/>
          <text x="800" y="850" text-anchor="middle" font-family="'Avenir Next', sans-serif" font-style="italic" font-weight="700" font-size="46" fill="${C.creme}">Toujours plein, jamais à plat !</text></g>
        </g>
        <g data-id="parasites" opacity="0">${Array.from({ length: 14 }, (_, i) => `<rect data-id="bande${i}" x="0" y="${i * 64}" width="1600" height="${20 + (i * 37) % 40}" fill="${i % 3 ? '#fff' : '#58e'}" opacity="0.5"/>`).join('')}</g>
      </g>
      <circle data-id="point" cx="800" cy="450" r="10" fill="#fff" opacity="0"/>`);
    return {
      g,
      maj(t) {
        const tc = COUPURE - TELE_FIN;   // instant de la coupure dans ce plan
        $('rayons').setAttribute('transform', `rotate(${Math.min(t, tc) * 8} 520 500)`);
        const coupe = t >= tc;
        visible($('wattyClin'), !coupe); visible($('wattyFige'), coupe);
        const main = $('wattyClin').querySelector('[data-id="watty-main"]');
        if (main) main.setAttribute('transform', `rotate(${Math.sin(t * 7) * 12} 112 88)`);
        const clin = $('wattyClin').querySelector('[data-id="watty-clin"]');
        $('wattyClin').setAttribute('transform', `translate(330 ${220 - Math.abs(Math.sin(t * 4.4)) * 18}) scale(3.2)`);
        // « WATT » et « NOW? » arrivent avec la voix du jingle (3,18 s et 3,64 s après le début du thème)
        const w = rebond(seg(t, 3.12, 3.42)), n = rebond(seg(t, 3.6, 3.95));
        $('watt').setAttribute('transform', `translate(1080 400) scale(${Math.max(0.001, w)})`);
        $('now').setAttribute('transform', `translate(1080 600) scale(${Math.max(0.001, n)}) rotate(${n > 0.9 ? -4 : 0})`);
        opacite($('slogan'), seg(t, 0.8, 1.2));
        if (clin) opacite(clin, 1);
        // la coupure : l'image se déchire, puis le tube s'éteint (trait, puis point)
        const p = $('parasites');
        if (coupe) {
          const u = t - tc;
          opacite(p, u < 0.45 ? 0.6 + 0.4 * Math.sin(u * 90) : 0);
          for (let i = 0; i < 14; i++) $(`bande${i}`).setAttribute('transform', `translate(${Math.sin(u * 70 + i * 2.1) * 120} 0)`);
          $('image').setAttribute('transform', u < 0.45 ? `translate(${Math.sin(u * 55) * 40} 0)` : '');
          const v = seg(u, 0.45, 0.62), h = seg(u, 0.62, 0.78);
          $('ecran').setAttribute('transform', `translate(800 450) scale(${Math.max(0.002, 1 - h)} ${Math.max(0.004, 1 - v)}) translate(-800 -450)`);
          opacite($('ecran'), u < 0.78 ? 1 : 0);
          opacite($('point'), u >= 0.7 ? 1 - seg(u, 0.8, 1.8) : 0);
          $('point').setAttribute('r', 10 - seg(u, 0.8, 1.8) * 8);
        } else {
          opacite(p, 0); $('image').setAttribute('transform', ''); $('ecran').setAttribute('transform', ''); opacite($('ecran'), 1); opacite($('point'), 0);
        }
      },
    };
  },
};

export const PLANS_TELE = [allumage, telachat, meteo, tendances, bienEtre, nature, reclame];

/** Les cartons : ce que disent les présentateurs (texte seul, sans voix). */
export const CARTONS_TELE = [
  [3.4, 5.9, 'Souffler sur sa soupe ? Quelle corvée !', 'tele'],
  [6.0, 8.6, 'Avec le Souffle-Soupe 3000, plus jamais d\'effort.', 'tele'],
  [9.2, 11.8, 'Demain, grand soleil sur toute la région…', 'tele'],
  [12.1, 14.9, '…pensez à lancer vos sèche-linge !', 'tele'],
  [15.4, 17.9, 'Le perron mécanique : trois marches, zéro effort.', 'tele'],
  [18.2, 20.9, 'Votre chien se promène tout seul. Vous, restez assis.', 'tele'],
  [21.4, 24.2, 'Le fauteuil qui vous nourrit. Il ne vous reste qu\'à mâcher.', 'tele'],
  [27.3, 29.9, 'Il pleut ? Vos arroseurs restent programmés.', 'tele'],
  [30.2, 32.9, 'Livraison express : une pomme, au pied de votre pommier.', 'tele'],
  [33.6, 37.8, 'Pourquoi réfléchir quand on peut brancher ?', 'pub'],
];

/** Les instants de zapping (bruit blanc, image qui saute). */
export const ZAPPINGS = [2.75, 8.75, 15, 21, 27];
