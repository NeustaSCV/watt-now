/* Watt Now? — intro, partie 2 : la Grande Panne, racontée par la radio (le thème principal naît sous les flashs).
   La ville s'éteint par plaques ; les volets électriques restent fermés en plein jour ; le frigo demande
   une mise à jour ; la nuit, un écran de téléphone attire ceux qui ne pensent plus : les Éteints. */

import { C, PEAUX, CHEVEUX, personne, poseBras, eteint, soleil } from './dessins.js';
import { groupe, opacite, visible, seg, doux, sortie, lerp, hasard } from './outils.js';
import { COUPURE, NAISSANCE, CHARBONNIERS } from './temps.js';

const T = (w = 4) => `stroke="${C.encre}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const OMBRE = '#0b0f1a';

/* ===================================================================== 1. La ville s'éteint par plaques */
const ville = {
  debut: NAISSANCE - 1.2, fin: NAISSANCE + 7,
  creer() {
    const r = hasard(11);
    const immeubles = [];
    const fenetres = [];
    let x = -20;
    let n = 0;
    while (x < 1620) {
      const w = 90 + r() * 150, h = 180 + r() * 380, y = 720 - h;
      const plaque = Math.floor((x + w / 2) / 330);   // la ville s'éteint par quartiers, de gauche à droite (en désordre)
      immeubles.push(`<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${h + 200}" fill="${['#1a2236', '#202a42', '#172033'][n % 3]}" stroke="#0e1424" stroke-width="3"/>`);
      if (r() < 0.3) immeubles.push(`<rect x="${(x + w * 0.4).toFixed(0)}" y="${(y - 40).toFixed(0)}" width="8" height="40" fill="#0e1424"/><circle cx="${(x + w * 0.4 + 4).toFixed(0)}" cy="${(y - 44).toFixed(0)}" r="5" fill="#ff4b3a" data-id="balise${n}"/>`);
      for (let fy = y + 24; fy < 700; fy += 38) {
        for (let fx = x + 14; fx < x + w - 22; fx += 30) {
          if (r() < 0.62) fenetres.push({ x: fx, y: fy, plaque, couleur: r() < 0.25 ? '#bfe3ff' : '#ffd98a', hasard: r() });
        }
      }
      x += w + 6;
      n++;
    }
    const ordre = [2, 0, 4, 1, 3];   // l'ordre dans lequel les quartiers s'éteignent
    const lumieres = [0, 1, 2, 3, 4].map((q) => `<g data-id="q${q}">${fenetres.filter((f) => f.plaque === q).map((f) => `<rect x="${f.x.toFixed(0)}" y="${f.y.toFixed(0)}" width="16" height="20" fill="${f.couleur}"/>`).join('')}</g>`).join('');
    const etoiles = Array.from({ length: 60 }, () => `<circle cx="${(r() * 1600).toFixed(0)}" cy="${(r() * 420).toFixed(0)}" r="${(1 + r() * 1.6).toFixed(1)}" fill="#fff"/>`).join('');
    const { g, $ } = groupe(`
      <rect width="1600" height="900" fill="url(#ciel-nuit)"/>
      <g data-id="etoiles" opacity="0">${etoiles}</g>
      <circle cx="1300" cy="150" r="46" fill="#f1ead2" opacity="0.9"/>
      <g data-id="halo"><ellipse cx="800" cy="700" rx="1000" ry="320" fill="#ffb35a" opacity="0.18"/></g>
      ${immeubles.join('')}
      ${lumieres}
      <rect y="715" width="1600" height="200" fill="#0e1424"/>
      <g data-id="pont">${Array.from({ length: 30 }, (_, i) => `<circle data-id="lampadaire${i}" cx="${i * 56 + 20}" cy="740" r="4" fill="#ffd98a"/>`).join('')}</g>`);
    return {
      g,
      maj(t) {
        const u = t - 1.2;   // 0 = début de la naissance du thème
        let allumees = 0;
        ordre.forEach((q, i) => {
          const a = 1.4 + i * 1.15;
          const k = u < a ? 1 : u < a + 0.35 ? (Math.sin(u * 80) > 0 ? 0.8 : 0.15) : 0;   // ça grésille, puis ça s'éteint
          opacite($(`q${q}`), k);
          allumees += k;
        });
        opacite($('halo'), allumees / 5);
        opacite($('etoiles'), 1 - allumees / 5);
        opacite($('pont'), u < 6.4 ? 1 : 0);
      },
    };
  },
};

/* ===================================================================== 2. Les volets électriques fermés, en plein jour */
const volets = {
  debut: NAISSANCE + 7, fin: NAISSANCE + 12.4,
  creer() {
    const lames = (w, h, ouvert, id) => `<g data-id="${id}">${Array.from({ length: Math.ceil(h / 18) }, (_, i) => `<rect x="0" y="${i * 18}" width="${w}" height="16" fill="#cfd4d6" stroke="#8d969b" stroke-width="2"/>`).join('')}</g>`;
    const maison = (x, couleur, id, coince) => `
      <g transform="translate(${x} 250)">
        <path d="M-20 90 L210 -40 L440 90" fill="${C.rouge}" ${T(5)}/>
        <rect x="0" y="80" width="420" height="440" fill="${couleur}" ${T(5)}/>
        ${[[50, 150], [250, 150], [50, 330], [250, 330]].map(([fx, fy], i) => `
          <g transform="translate(${fx} ${fy})">
            <rect x="-8" y="-14" width="136" height="16" fill="#9aa3a8" ${T(3)}/>
            <rect width="120" height="130" fill="#2a3140" ${T(4)}/>
            <svg x="0" y="0" width="120" height="130"><g data-id="${id}${i}">${lames(120, 140, 0)}</g></svg>
            <rect width="120" height="130" fill="none" ${T(4)}/>
            ${coince && i === 1 ? `<g data-id="yeux" opacity="0"><circle cx="48" cy="118" r="5" fill="#fff"/><circle cx="72" cy="118" r="5" fill="#fff"/><circle cx="49" cy="119" r="2.5" fill="${C.encre}"/><circle cx="73" cy="119" r="2.5" fill="${C.encre}"/></g>` : ''}
          </g>`).join('')}
        <rect x="170" y="400" width="80" height="120" fill="${C.canard}" ${T(4)}/>
      </g>`;
    const { g, $ } = groupe(`
      <rect width="1600" height="900" fill="url(#ciel-jour)"/>
      ${soleil(1420, 130, 56, 'rayonsV')}
      <rect y="770" width="1600" height="130" fill="#cdbfa6" ${T(4)}/>
      ${maison(120, C.mur, 'va', false)}
      ${maison(640, '#cfe3d6', 'vb', true)}
      ${maison(1160, '#f1c6a8', 'vc', false)}
      <g transform="translate(1040 780) scale(0.9)" data-id="passant">${personne('pa', { peau: PEAUX[4], haut: '#5a6a7a', coiffure: 'court', cheveux: CHEVEUX[0], regard: -1, bouche: 'plat', outil: `<rect x="-12" y="-4" width="24" height="40" rx="4" fill="${C.ecran}" ${T(2.5)}/><rect x="-8" y="0" width="16" height="30" fill="#333"/>`, outilCote: 1 })}</g>`);
    return {
      g,
      maj(t) {
        // un volet tente de remonter : il hoquette, puis retombe
        const v = $('vb1');
        const essai = seg(t, 1.2, 2.2) - seg(t, 2.3, 2.5);
        v.setAttribute('transform', `translate(0 ${-essai * 22 + (t > 1.2 && t < 2.3 ? Math.sin(t * 60) * 2 : 0)})`);
        opacite($('yeux'), essai > 0.6 ? 1 : 0);
        $('rayonsV').setAttribute('transform', `rotate(${t * 8})`);
        $('passant').setAttribute('transform', `translate(${1040 - t * 30} 780) scale(0.9)`);
        poseBras($, 'pa', 'd', -25, -100);
        poseBras($, 'pa', 'g', 8, 0);
      },
    };
  },
};

/* ===================================================================== 3. Le frigo connecté demande une mise à jour */
const frigo = {
  debut: NAISSANCE + 12.4, fin: NAISSANCE + 16.9,
  creer() {
    const { g, $ } = groupe(`
      <rect width="1600" height="900" fill="#2a2f3c"/>
      <rect x="0" y="640" width="1600" height="260" fill="#232733"/>
      <rect x="140" y="160" width="300" height="200" fill="#56607a" ${T(5)}/>
      <g transform="translate(560 90)">
        <rect width="420" height="700" rx="22" fill="#c9d0d6" ${T(6)}/>
        <path d="M0 260 H420" ${T(5)}/>
        <rect x="380" y="90" width="16" height="120" rx="8" fill="${C.grisFonce}" ${T(3)}/><rect x="380" y="300" width="16" height="200" rx="8" fill="${C.grisFonce}" ${T(3)}/>
        <rect x="70" y="320" width="280" height="190" rx="12" fill="#11161d" ${T(4)}/>
        <g data-id="ecran">
          <rect x="80" y="330" width="260" height="170" rx="8" fill="#1f6fbf"/>
          <text x="210" y="380" text-anchor="middle" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="22" fill="#fff">Mise à jour requise</text>
          <text x="210" y="412" text-anchor="middle" font-family="'Avenir Next', sans-serif" font-size="18" fill="#d6e8ff">Veuillez patienter…</text>
          <rect x="110" y="440" width="200" height="16" rx="8" fill="#0d3c6a"/>
          <rect data-id="barre" x="110" y="440" width="198" height="16" rx="8" fill="#7fd0ff"/>
          <text data-id="pourcent" x="210" y="485" text-anchor="middle" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="16" fill="#fff">99 %</text>
        </g>
      </g>
      <g data-id="lueur"><ellipse cx="770" cy="420" rx="420" ry="300" fill="url(#halo-ecran)" opacity="0.5"/></g>
      <g transform="translate(1230 820) scale(1.05)">${personne('fr', { peau: PEAUX[0], haut: '#8a5aa8', bas: '#3d4a5c', coiffure: 'long', cheveux: CHEVEUX[2], regard: -1, bouche: 'plat', outil: `<path d="M-14 -4 L-10 52 H10 L14 -4 Z" fill="#cfe9f2" fill-opacity="0.6" ${T(3)}/>`, outilCote: -1 })}</g>
      <g transform="translate(250 760) rotate(-12)">
        <rect x="-60" y="-14" width="120" height="28" rx="10" fill="${C.grisFonce}" ${T(4)}/>
        <path d="M-60 -14 V-34 M60 -14 V-34" ${T(5)}/>
        <path d="M-104 -38 H-16 M16 -38 H104" ${T(5)}/>
      </g>
      <rect data-id="noir" width="1600" height="900" fill="#000" opacity="0"/>`);
    return {
      g,
      maj(t) {
        poseBras($, 'fr', 'g', 70, 40);
        poseBras($, 'fr', 'd', 6, 0);
        const meurt = t > 3.0;
        const k = t > 2.6 && t < 3.0 ? (Math.sin(t * 70) > 0 ? 1 : 0.2) : meurt ? 0 : 1;
        opacite($('ecran'), k); opacite($('lueur'), k);
        $('pourcent').textContent = '99 %';
        opacite($('noir'), seg(t, 3.0, 4.4) * 0.55);
      },
    };
  },
};

/* ===================================================================== 4. La nuit : un écran allumé, et ceux qui viennent vers la lumière */
const ecranNuit = {
  debut: NAISSANCE + 16.9, fin: CHARBONNIERS,
  creer() {
    const silhouettes = [[-260, 0.82, 0], [-520, 0.7, 1], [330, 0.78, 2], [600, 0.64, 3], [-760, 0.55, 4]]
      .map(([dx, s, i]) => `<g data-id="e${i}" transform="translate(${800 + dx} 800) scale(${s})" opacity="0">${eteint(`ei${i}`, { sil: OMBRE, regard: 1 })}</g>`).join('');
    const { g, $ } = groupe(`
      <rect width="1600" height="900" fill="#0b101c"/>
      <path d="M0 640 H1600 V900 H0 Z" fill="#111827"/>
      <g opacity="0.6"><rect x="80" y="220" width="200" height="420" fill="#0e1424"/><rect x="1300" y="160" width="240" height="480" fill="#0e1424"/></g>
      <g data-id="lumiere"><ellipse cx="800" cy="560" rx="560" ry="380" fill="url(#halo-ecran)" opacity="0.65"/></g>
      ${silhouettes}
      <g transform="translate(800 720)">
        <rect x="-170" y="-10" width="340" height="22" rx="6" fill="#2a3346" stroke="#0b0f1a" stroke-width="4"/>
        <path d="M-150 12 V80 M150 12 V80" stroke="#0b0f1a" stroke-width="12"/>
        <g transform="translate(0 0) scale(1.15)">${personne('ne', { assis: true, peau: '#7d8fa8', haut: '#2e3a52', bas: '#1d2638', chaussures: '#0b0f1a', cheveux: '#11151f', coiffure: 'court', regard: 0, bouche: 'plat', outil: `<g data-id="tel"><rect x="-20" y="-6" width="40" height="60" rx="6" fill="#0b0f1a"/><rect x="-16" y="-2" width="32" height="50" rx="3" fill="#cfe9ff"/></g>`, outilCote: 1 })}</g>
      </g>
      <rect data-id="noir" width="1600" height="900" fill="#000" opacity="0"/>`);
    const r = hasard(5);
    const dephasage = [0, 1, 2, 3, 4].map(() => r() * 6);
    return {
      g,
      maj(t, T) {
        poseBras($, 'ne', 'd', -40, -110);
        poseBras($, 'ne', 'g', -10, -100);
        // les silhouettes s'approchent, lentement, en se balançant (bras tendus)
        for (let i = 0; i < 5; i++) {
          const el = $(`e${i}`);
          const [dx, s] = [[-260, 0.82], [-520, 0.7], [330, 0.78], [600, 0.64], [-760, 0.55]][i];
          const k = seg(t, 0.8 + i * 0.6, 9);
          const x = 800 + dx * (1 - 0.35 * k), y = 800 + Math.sin(t * 2 + dephasage[i]) * 4;
          const e = s * (1 + 0.15 * k);
          el.setAttribute('transform', `translate(${x} ${y}) scale(${dx > 0 ? -e : e} ${e}) rotate(${Math.sin(t * 1.6 + dephasage[i]) * 3})`);
          const tete = $(`ei${i}-tete`); if (tete) tete.setAttribute('transform', `translate(6 -244) rotate(${14 + Math.sin(t * 0.9 + i) * 6})`);
          opacite(el, seg(t, 0.5 + i * 0.6, 2.2 + i * 0.6));
          poseBras($, `ei${i}`, 'd', -78 + Math.sin(t * 1.3 + i) * 5, -6);
          poseBras($, `ei${i}`, 'g', -82 + Math.sin(t * 1.1 + i) * 5, 4);
        }
        // le téléphone : batterie faible, il clignote, il s'éteint
        const fin = t > 8.2;
        const clignote = t > 7.4 && !fin ? (Math.sin(t * 40) > 0 ? 1 : 0.3) : fin ? 0 : 1;
        opacite($('lumiere'), clignote * 0.95);
        const tel = $('tel'); if (tel) tel.lastElementChild.setAttribute('fill', fin ? '#0b0f1a' : '#cfe9ff');
        opacite($('noir'), seg(t, 8.3, 9.6));
      },
    };
  },
};

export const PLANS_PANNE = [ville, volets, frigo, ecranNuit];

export const CARTONS_PANNE = [
  [COUPURE + 1.6, NAISSANCE - 0.3, 'Ce soir-là, l\'écran s\'est éteint. Puis tous les autres.', 'recit'],
  [NAISSANCE + 0.6, NAISSANCE + 3.8, 'Flash spécial. Coupures de courant dans toute la région.', 'radio'],
  [NAISSANCE + 3.9, NAISSANCE + 6.9, 'Restez calmes : le réseau sera rétabli dans les plus brefs délais.', 'radio'],
  [NAISSANCE + 7.4, NAISSANCE + 12.2, 'N\'ouvrez pas vos volets à la main. Attendez la mise à jour.', 'radio'],
  [NAISSANCE + 12.7, NAISSANCE + 16.6, 'Les livraisons sont suspendues. Les frigos ne répondent plus.', 'radio'],
  [NAISSANCE + 17.3, NAISSANCE + 20.4, 'Fièvre grise : évitez les malades. Ils sont attirés par le bruit… et par la lumière.', 'radio'],
  [NAISSANCE + 20.6, NAISSANCE + 22.6, 'On les appelle… les Éteints.', 'radio'],
];
