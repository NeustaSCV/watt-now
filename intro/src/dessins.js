/* Watt Now? — intro : les dessins communs (palette, personnages, Watty, logo).
   Style : l'affiche de l'Abondance (Book 18 §6) : aplats francs, trait d'encre, papier crème, rouge publicitaire.
   Repère de la scène : 1600 × 900. Les personnages ont l'origine à leurs pieds (debout) ou au bassin (assis). */

export const C = {
  creme: '#f4ecd8', cremeFonce: '#e6dabd', rouge: '#c8362b', rougeFonce: '#8f2219',
  encre: '#3b2a1e', canard: '#1f5e66', ocre: '#c98a2e', jaune: '#e8c547', nuit: '#1d2433',
  ciel: '#9fd3e0', cielClair: '#cdeaf0', herbe: '#8cbf5a', herbeFonce: '#5f9a3e', terre: '#8a5a3a',
  mur: '#f0d9b5', murFonce: '#d9b98c', bois: '#a8703f', boisFonce: '#7a4b26', gris: '#9aa0a6', grisFonce: '#5f656b',
  metal: '#b9c2c9', ecran: '#2b3440',
  charbonniers: '#a4552f', voltaiques: '#2f5fa4', mecanistes: '#7f8f3a',
  feu: '#ff9a3c', feuVif: '#ffd27a', lampe: '#eef6ff', lanterne: '#ffd98a',
  eteint: '#8fa38a',
};

export const PEAUX = ['#f3cfb0', '#e3ad86', '#c98d63', '#a26a43', '#7b4b2d', '#5b3621'];
export const CHEVEUX = ['#2a1d15', '#5a3a22', '#a8743e', '#d9b46a', '#8e8a85', '#c9c4bd'];

const T = (w = 4) => `stroke="${C.encre}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

/* ------------------------------------------------------------------ Personnages */

/** Coiffures, autour d'une tête de rayon 30 centrée en (0,0). */
function coiffure(type, couleur, sil) {
  const f = sil || couleur, t = sil ? '' : T(3);
  switch (type) {
    case 'long': return `<path d="M-33 4 C-38 -30 -20 -40 0 -40 C22 -40 38 -30 33 4 L36 44 C26 50 18 46 18 30 L18 -12 C8 -20 -10 -22 -18 -12 L-18 30 C-18 46 -26 50 -36 44 Z" fill="${f}" ${t}/>`;
    case 'chignon': return `<circle cx="0" cy="-42" r="15" fill="${f}" ${t}/><path d="M-32 0 C-34 -30 -18 -38 0 -38 C18 -38 34 -30 32 0 C28 -16 18 -22 0 -22 C-18 -22 -28 -16 -32 0 Z" fill="${f}" ${t}/>`;
    case 'boucles': return `<g fill="${f}" ${t}>${[[-26, -14], [-18, -30], [0, -36], [18, -30], [26, -14], [30, 2], [-30, 2]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13"/>`).join('')}</g>`;
    case 'ras': return `<path d="M-30 -6 C-30 -30 -16 -36 0 -36 C16 -36 30 -30 30 -6 C24 -20 14 -24 0 -24 C-14 -24 -24 -20 -30 -6 Z" fill="${f}" ${t}/>`;
    case 'chauve': return '';
    case 'gris': return `<path d="M-32 6 C-36 -12 -30 -22 -24 -18 C-20 -30 20 -30 24 -18 C30 -22 36 -12 32 6 C30 -6 26 -10 22 -8 C14 -18 -14 -18 -22 -8 C-26 -10 -30 -6 -32 6 Z" fill="${f}" ${t}/>`;
    default: return `<path d="M-32 0 C-34 -30 -18 -40 2 -40 C22 -40 36 -28 32 0 C28 -14 20 -22 8 -24 C4 -16 -10 -14 -22 -18 C-26 -12 -30 -6 -32 0 Z" fill="${f}" ${t}/>`;
  }
}

/** Un bras : un groupe à l'épaule (rotation), le bras, puis l'avant-bras (rotation au coude) et la main. */
function bras(id, cote, o) {
  const peau = o.sil || o.peau, manche = o.sil || o.haut, t = o.sil ? '' : T(3);
  const x = cote * 36;
  return `<g data-id="${id}-e${cote > 0 ? 'd' : 'g'}" transform="translate(${x} -198)">
      <path d="M-9 -4 Q-11 26 -8 50 L8 50 Q11 26 9 -4 Z" fill="${manche}" ${t}/>
      <g data-id="${id}-c${cote > 0 ? 'd' : 'g'}" transform="translate(0 46)">
        <path d="M-7 0 L-6 40 L6 40 L7 0 Z" fill="${o.mancheCourte ? peau : manche}" ${t}/>
        <circle data-id="${id}-m${cote > 0 ? 'd' : 'g'}" cx="0" cy="46" r="9" fill="${peau}" ${t}/>
        ${o.outil && cote === o.outilCote ? `<g transform="translate(0 46)">${o.outil}</g>` : ''}
      </g>
    </g>`;
}

/**
 * Un personnage. Options :
 *  peau, haut, bas, chaussures, cheveux, coiffure, barbe, lunettes, regard (-1 / 0 / 1), bouche ('sourire', 'o', 'plat', 'aucune'),
 *  assis (bassin à l'origine, jambes vers +x), sil (couleur unique : silhouette en contre-jour), tete (balisage en plus sur la tête),
 *  dessus (balisage en plus sur le torse : tablier, câble…), outil + outilCote (dans la main), eteint (yeux blancs, bras tendus par défaut).
 */
export function personne(id, o = {}) {
  o = { peau: PEAUX[1], haut: C.canard, bas: '#3d4a5c', chaussures: C.encre, cheveux: CHEVEUX[0], coiffure: 'court', regard: 0, bouche: 'sourire', outilCote: 1, ...o };
  const s = o.sil, t = s ? '' : T(3.5), peau = s || o.peau;
  const jambes = o.assis
    ? `<g data-id="${id}-jambes">
         <path d="M-24 -10 L46 -12 L46 12 L-24 14 Z" fill="${s || o.bas}" ${t}/>
         <path d="M34 0 L36 64 L52 64 L54 0 Z" fill="${s || o.bas}" ${t}/>
         <ellipse cx="52" cy="68" rx="16" ry="7" fill="${s || o.chaussures}"/>
       </g>`
    : `<g data-id="${id}-jambes">
         <path data-id="${id}-jg" d="M-24 -122 L-22 -6 L-6 -6 L-3 -122 Z" fill="${s || o.bas}" ${t}/>
         <path data-id="${id}-jd" d="M3 -122 L6 -6 L22 -6 L24 -122 Z" fill="${s || o.bas}" ${t}/>
         <ellipse cx="-16" cy="-3" rx="15" ry="7" fill="${s || o.chaussures}"/><ellipse cx="16" cy="-3" rx="15" ry="7" fill="${s || o.chaussures}"/>
       </g>`;
  const dy = o.assis ? 118 : 0;   // assis : le haut du corps descend jusqu'au bassin
  const yeux = o.eteint
    ? `<circle cx="${-11 + o.regard * 6}" cy="-2" r="6" fill="#f4f6ee"/><circle cx="${11 + o.regard * 6}" cy="-2" r="6" fill="#f4f6ee"/>`
    : `<circle cx="${-11 + o.regard * 7}" cy="-2" r="4" fill="${C.encre}"/><circle cx="${11 + o.regard * 7}" cy="-2" r="4" fill="${C.encre}"/>`;
  const bouches = {
    sourire: `<path d="M${-10 + o.regard * 6} 12 Q${o.regard * 6} 22 ${10 + o.regard * 6} 12" fill="none" ${T(3)}/>`,
    o: `<ellipse cx="${o.regard * 6}" cy="15" rx="5" ry="6" fill="${C.rougeFonce}" ${T(2)}/>`,
    plat: `<path d="M${-8 + o.regard * 6} 15 L${8 + o.regard * 6} 15" ${T(3)}/>`,
    gonfle: `<ellipse cx="${o.regard * 8}" cy="14" rx="7" ry="4" fill="${C.rougeFonce}" ${T(2)}/>`,
    aucune: '',
  };
  const visage = s ? '' : `${yeux}${bouches[o.bouche] || ''}
      ${o.lunettes ? `<g fill="none" ${T(2.5)}><circle cx="${-11 + o.regard * 7}" cy="-2" r="9"/><circle cx="${11 + o.regard * 7}" cy="-2" r="9"/><path d="M${-2 + o.regard * 7} -2 h4"/></g>` : ''}
      ${o.joues ? `<ellipse cx="-18" cy="10" rx="6" ry="3.5" fill="#e98f7a" opacity="0.55"/><ellipse cx="18" cy="10" rx="6" ry="3.5" fill="#e98f7a" opacity="0.55"/>` : ''}`;
  const barbe = o.barbe ? `<path d="M-28 4 C-26 34 -12 42 0 42 C12 42 26 34 28 4 C20 18 -20 18 -28 4 Z" fill="${s || o.cheveux}" ${s ? '' : T(2.5)}/>` : '';
  return `<g data-id="${id}">
    ${jambes}
    <g data-id="${id}-haut" transform="translate(0 ${dy})">
      ${o.derriere || ''}
      ${bras(id, -1, o)}
      <path d="M-36 -206 C-40 -170 -32 -140 -28 -118 L28 -118 C32 -140 40 -170 36 -206 C20 -214 -20 -214 -36 -206 Z" fill="${s || o.haut}" ${t}/>
      ${o.dessus || ''}
      <rect x="-9" y="-222" width="18" height="16" fill="${peau}" ${s ? '' : T(3)}/>
      <g data-id="${id}-tete" transform="translate(0 -250)">
        <circle cx="0" cy="0" r="30" fill="${peau}" ${t}/>
        ${o.eteint && s ? `<circle cx="${-10 + o.regard * 9}" cy="-2" r="5" fill="#e9efe4" opacity="0.9"/><circle cx="${10 + o.regard * 9}" cy="-2" r="5" fill="#e9efe4" opacity="0.9"/>` : ''}
        ${barbe}
        ${coiffure(o.coiffure, o.cheveux, s)}
        ${visage}
        ${o.tete || ''}
      </g>
      ${bras(id, 1, o)}
    </g>
  </g>`;
}

/** Oriente un bras : angle à l'épaule et au coude, en degrés (0 = pendant). */
export function poseBras($, id, cote, epaule, coude = 0) {
  const e = $(`${id}-e${cote}`), c = $(`${id}-c${cote}`);
  if (e) e.setAttribute('transform', `translate(${cote === 'd' ? 36 : -36} -198) rotate(${epaule.toFixed(2)})`);
  if (c) c.setAttribute('transform', `translate(0 46) rotate(${coude.toFixed(2)})`);
}

/** Un Éteint en silhouette ou en couleur : peau gris-vert, yeux blancs, bras tendus (Book 18 §4). */
export function eteint(id, o = {}) {
  return personne(id, { peau: C.eteint, haut: '#6d6a5e', bas: '#4c4a44', cheveux: '#3a3a34', coiffure: 'ras', bouche: 'plat', eteint: true, ...o });
}

/* ------------------------------------------------------------------ Les trois visages des familles (Book 18 §4.1) */

/** 🔥 Nadia, Charbonnière : bandana, lunettes de soudeur relevées, tablier de cuir, marteau. */
export function nadia(id, o = {}) {
  const sil = o.sil;
  const t = sil ? '' : T(3);
  return personne(id, {
    peau: PEAUX[3], haut: '#8b3a2a', bas: '#3b3330', chaussures: '#2a201a', cheveux: CHEVEUX[0], coiffure: 'chignon', regard: 0, bouche: 'plat',
    tete: `<path d="M-31 -10 C-20 -26 20 -26 31 -10 L31 -2 C20 -14 -20 -14 -31 -2 Z" fill="${sil || C.rouge}" ${t}/>
           <g transform="translate(0 -22)"><rect x="-26" y="-9" width="22" height="16" rx="7" fill="${sil || '#3c4b52'}" ${t}/><rect x="4" y="-9" width="22" height="16" rx="7" fill="${sil || '#3c4b52'}" ${t}/>
           ${sil ? '' : '<circle cx="-15" cy="-1" r="4" fill="#9fd3e0" opacity="0.6"/><circle cx="15" cy="-1" r="4" fill="#9fd3e0" opacity="0.6"/>'}</g>`,
    dessus: `<path d="M-30 -196 L30 -196 L34 -40 L-34 -40 Z" fill="${sil || '#7a4b26'}" ${t}/>
             ${sil ? '' : `<path d="M-30 -196 L-40 -214 M30 -196 L40 -214" ${T(3)}/><rect x="-14" y="-130" width="28" height="20" rx="3" fill="#5e3a1d" ${T(2)}/>`}`,
    outil: `<g transform="rotate(-90)"><rect x="-4" y="-6" width="8" height="70" fill="${sil || C.bois}" ${t}/><rect x="-20" y="56" width="40" height="22" rx="3" fill="${sil || C.grisFonce}" ${t}/></g>`,
    outilCote: 1,
    ...o,
  });
}

/** ⚡ Malik, Voltaïque : lampe frontale, câble orange en bandoulière, bande réfléchissante, lunettes rondes. */
export function malik(id, o = {}) {
  const sil = o.sil;
  const t = sil ? '' : T(3);
  return personne(id, {
    peau: PEAUX[4], haut: C.voltaiques, bas: '#26324a', chaussures: '#1c1c1c', cheveux: CHEVEUX[0], coiffure: 'ras', barbe: true, lunettes: true, regard: 0, bouche: 'plat',
    tete: `<path d="M-31 -12 C-20 -18 20 -18 31 -12" fill="none" stroke="${sil || '#222'}" stroke-width="6"/>
           <g data-id="${id}-lampe"><rect x="-11" y="-26" width="22" height="16" rx="4" fill="${sil || '#f0f0f0'}" ${t}/><circle cy="-18" r="5" fill="${o.lampeAllumee === false ? (sil || '#888') : '#fffbe8'}"/></g>`,
    dessus: sil ? `<path d="M-34 -205 L34 -120" stroke="${sil}" stroke-width="10"/>`
      : `<path d="M-34 -150 H34 M-32 -136 H32" stroke="#f2d94a" stroke-width="7"/><path d="M-30 -205 L30 -122" stroke="#e8772a" stroke-width="9" stroke-linecap="round"/>`,
    derriere: `<rect x="-30" y="-200" width="60" height="70" rx="6" fill="${sil || '#3c3c3c'}" ${t}/>`,
    outil: `<g transform="rotate(-20)"><rect x="-8" y="0" width="16" height="30" rx="3" fill="${sil || '#e8c547'}" ${t}/><rect x="-4" y="28" width="8" height="18" fill="${sil || '#222'}"/></g>`,
    outilCote: 1,
    ...o,
  });
}

/** ⚙️ Rose, Mécaniste : chapeau de paille, hotte en osier, cheveux gris. */
export function rose(id, o = {}) {
  const sil = o.sil;
  const t = sil ? '' : T(3);
  return personne(id, {
    peau: PEAUX[1], haut: '#6f8a3a', bas: '#c9b48a', chaussures: '#3d4a2a', cheveux: CHEVEUX[5], coiffure: 'gris', regard: 0, bouche: 'sourire', joues: true,
    tete: `<ellipse cx="0" cy="-22" rx="56" ry="11" fill="${sil || '#e3c46a'}" ${t}/><path d="M-28 -24 C-28 -52 28 -52 28 -24 Z" fill="${sil || '#e3c46a'}" ${t}/>
           ${sil ? '' : `<path d="M-27 -30 H27" stroke="${C.rouge}" stroke-width="6"/>`}`,
    dessus: sil ? '' : `<path d="M-26 -206 L-18 -120 M26 -206 L18 -120" stroke="#7a4b26" stroke-width="6" stroke-linecap="round"/><path d="M-32 -110 H32 L28 -60 H-28 Z" fill="#e6dabd" ${T(2.5)}/>`,
    derriere: `<path d="M-46 -230 L46 -230 L38 -110 L-38 -110 Z" fill="${sil || '#b98a4a'}" ${t}/>
               ${sil ? '' : `<path d="M-44 -205 H44 M-41 -180 H41 M-40 -155 H40 M-38 -132 H38" stroke="#8a5a2a" stroke-width="3"/>`}`,
    ...o,
  });
}

export const VISAGES = { charbonniers: nadia, voltaiques: malik, mecanistes: rose };

/* ------------------------------------------------------------------ Watty et le logo (repris de code/client/src/watty.ts) */

export function watty(pose = 'salut', o = {}) {
  const panne = pose === 'panne' || pose === 'fige';
  const trait = `stroke="${C.encre}" stroke-width="5" stroke-linecap="round" fill="none"`;
  const gant = (x, y) => `<circle cx="${x}" cy="${y}" r="9" fill="${C.creme}" stroke="${C.encre}" stroke-width="3"/>`;
  const oeil = (x) => `<ellipse cx="${x}" cy="62" rx="5" ry="7" fill="${C.encre}"/><circle cx="${x + 1.5}" cy="59" r="1.8" fill="#fff"/>`;
  const brasD = pose === 'salut' || pose === 'clin'
    ? `<g data-id="watty-main"><path d="M110 86 C128 76 134 58 132 44" ${trait}/>${gant(132, 40)}</g>`
    : `<path d="M110 92 C126 96 130 110 128 122" ${trait}/>${gant(128, 124)}`;
  const yeux = pose === 'clin'
    ? `${oeil(55)}<g data-id="watty-clin"><path d="M80 62 q5 -5 10 0" stroke="${C.encre}" stroke-width="3.5" fill="none" stroke-linecap="round"/></g>`
    : pose === 'fige'
      ? `${oeil(55)}<path d="M79 61 q6 -2 12 0" stroke="${C.encre}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
      : oeil(55) + oeil(85);
  return `<g ${o.id ? `data-id="${o.id}"` : ''}>
    <rect x="58" y="6" width="24" height="12" rx="3" fill="#b9b2a2" stroke="${C.encre}" stroke-width="3"/>
    <rect x="30" y="16" width="80" height="128" rx="16" fill="${pose === 'panne' ? '#8a8f94' : C.jaune}" stroke="${C.encre}" stroke-width="4"/>
    <rect x="32" y="104" width="76" height="38" fill="${pose === 'panne' ? '#6e6a63' : C.rouge}"/>
    <rect x="30" y="16" width="80" height="128" rx="16" fill="none" stroke="${C.encre}" stroke-width="4"/>
    <path d="M74 106 L62 126 L72 126 L66 140 L82 118 L72 118 L78 106 Z" fill="${C.creme}" stroke="${C.encre}" stroke-width="2.5" stroke-linejoin="round"/>
    ${yeux}
    <path d="M50 78 q20 18 40 0" stroke="${C.encre}" stroke-width="3.5" fill="#7a1f17" stroke-linejoin="round"/>
    <path d="M56 82 q14 8 28 0" fill="#e88"/>
    <ellipse cx="44" cy="76" rx="5" ry="3" fill="#f2a08a" opacity="0.8"/><ellipse cx="96" cy="76" rx="5" ry="3" fill="#f2a08a" opacity="0.8"/>
    <path d="M30 92 C14 96 10 110 12 122" ${trait}/>${gant(12, 124)}
    ${brasD}
    <path d="M52 144 v16 M88 144 v16" stroke="${C.encre}" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="48" cy="162" rx="10" ry="5" fill="${C.rouge}" stroke="${C.encre}" stroke-width="2.5"/><ellipse cx="92" cy="162" rx="10" ry="5" fill="${C.rouge}" stroke="${C.encre}" stroke-width="2.5"/>
  </g>`;
}

/** Le logo WATT NOW? (bandeau rouge penché, éclair en coin) ; repère 300 × 108. */
export function logo() {
  return `<g transform="rotate(-3 150 54)">
      <rect x="6" y="14" width="288" height="72" rx="4" fill="${C.rouge}"/>
      <rect x="6" y="14" width="288" height="72" rx="4" fill="none" stroke="${C.encre}" stroke-width="3"/>
      <text x="150" y="67" text-anchor="middle" textLength="250" lengthAdjust="spacingAndGlyphs" font-family="Futura, 'Avenir Next Condensed', 'Arial Black', sans-serif" font-weight="900" font-size="42" fill="${C.creme}">WATT NOW?</text>
    </g>
    <g transform="translate(262 0) rotate(12)">
      <path d="M14 0 L2 26 L12 26 L6 44 L22 18 L12 18 L18 0 Z" fill="${C.jaune}" stroke="${C.encre}" stroke-width="2.5" stroke-linejoin="round"/>
    </g>`;
}

/* ------------------------------------------------------------------ Décors communs */

/** Un nuage d'affiche (aplat, contour léger). */
export const nuage = (x, y, s = 1, f = '#fff') =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-80 20 C-90 -6 -60 -20 -44 -10 C-38 -40 10 -44 20 -16 C40 -30 74 -16 70 10 C92 12 92 36 70 38 L-70 38 C-96 38 -96 18 -80 20 Z" fill="${f}" stroke="${C.encre}" stroke-width="3" opacity="0.95"/></g>`;

/** Soleil d'affiche, rayons en éventail. */
export const soleil = (x, y, r = 60, id = '') =>
  `<g transform="translate(${x} ${y})"><g ${id ? `data-id="${id}"` : ''}>${Array.from({ length: 12 }, (_, i) => `<path d="M-8 ${-r - 14} L0 ${-r - 44} L8 ${-r - 14} Z" fill="${C.jaune}" stroke="${C.encre}" stroke-width="2.5" transform="rotate(${i * 30})"/>`).join('')}</g>
   <circle r="${r}" fill="${C.jaune}" stroke="${C.encre}" stroke-width="4"/><path d="M${-r * 0.4} ${-r * 0.1} q${r * 0.1} -${r * 0.15} ${r * 0.2} 0 M${r * 0.2} ${-r * 0.1} q${r * 0.1} -${r * 0.15} ${r * 0.2} 0 M${-r * 0.3} ${r * 0.25} q${r * 0.3} ${r * 0.25} ${r * 0.6} 0" fill="none" stroke="${C.encre}" stroke-width="3.5" stroke-linecap="round"/></g>`;

/** Un arbre fruitier (pommier) ; origine au pied du tronc. */
export const pommier = (x, y, s = 1, pommes = 7, graine = 3) => {
  let k = graine;
  const r = () => ((k = (k * 9301 + 49297) % 233280) / 233280);
  const fruits = Array.from({ length: pommes }, () => `<circle cx="${(r() * 220 - 110).toFixed(0)}" cy="${(-230 - r() * 140).toFixed(0)}" r="12" fill="${C.rouge}" stroke="${C.encre}" stroke-width="2.5"/>`).join('');
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-16 0 L-12 -170 C-30 -200 -40 -210 -60 -220 M12 -170 L16 0 Z" fill="${C.boisFonce}" stroke="${C.encre}" stroke-width="4"/>
    <path d="M-18 0 C-14 -60 -14 -130 -14 -180 L14 -180 C14 -130 14 -60 18 0 Z" fill="${C.bois}" stroke="${C.encre}" stroke-width="4"/>
    <path d="M-150 -250 C-170 -330 -100 -400 -30 -390 C10 -440 110 -420 130 -360 C190 -340 180 -240 120 -220 C80 -180 -100 -180 -150 -250 Z" fill="${C.herbeFonce}" stroke="${C.encre}" stroke-width="4"/>
    <path d="M-110 -280 C-100 -340 -40 -370 10 -360" fill="none" stroke="#7fb352" stroke-width="10" stroke-linecap="round" opacity="0.6"/>
    ${fruits}
  </g>`;
};

/** Grain de papier et vignette, en filtres légers (calculés une fois). */
export const DEFS = `
  <defs>
    <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
      <stop offset="60%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.55"/>
    </radialGradient>
    <radialGradient id="halo-feu"><stop offset="0%" stop-color="${C.feuVif}" stop-opacity="0.95"/><stop offset="35%" stop-color="${C.feu}" stop-opacity="0.55"/><stop offset="100%" stop-color="${C.feu}" stop-opacity="0"/></radialGradient>
    <radialGradient id="halo-lampe"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/><stop offset="40%" stop-color="${C.lampe}" stop-opacity="0.45"/><stop offset="100%" stop-color="${C.lampe}" stop-opacity="0"/></radialGradient>
    <radialGradient id="halo-lanterne"><stop offset="0%" stop-color="#fff2c4" stop-opacity="0.95"/><stop offset="40%" stop-color="${C.lanterne}" stop-opacity="0.5"/><stop offset="100%" stop-color="${C.lanterne}" stop-opacity="0"/></radialGradient>
    <radialGradient id="halo-ecran"><stop offset="0%" stop-color="#bfe3ff" stop-opacity="0.8"/><stop offset="100%" stop-color="#bfe3ff" stop-opacity="0"/></radialGradient>
    <linearGradient id="faisceau" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.75"/><stop offset="100%" stop-color="${C.lampe}" stop-opacity="0"/></linearGradient>
    <linearGradient id="ciel-nuit" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0d1322"/><stop offset="100%" stop-color="#25304a"/></linearGradient>
    <linearGradient id="ciel-aube" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#26324f"/><stop offset="45%" stop-color="#7a6a8a"/><stop offset="75%" stop-color="#e7a17a"/><stop offset="100%" stop-color="#f7d49a"/></linearGradient>
    <linearGradient id="ciel-jour" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8fcbe0"/><stop offset="100%" stop-color="#dff1f2"/></linearGradient>
    <linearGradient id="ciel-pluie" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7d8a96"/><stop offset="100%" stop-color="#b9c2c6"/></linearGradient>
  </defs>`;
