/* Watt Now? — intro 3D : les cartons (les mots de la télé, de la radio, du récit), dessinés dans l'image elle-même,
   pour qu'ils soient aussi dans la vidéo exportée. Un style par voix (voir src/intro.css pour la version texte). */

import { police } from './textures.js';
import { C } from '../src/dessins.js';

/** Découpe un texte en lignes qui tiennent dans `largeur`. */
function lignes(ctx, texte, largeur) {
  const mots = texte.split(' ');
  const res = [];
  let l = '';
  for (const m of mots) {
    const essai = l ? `${l} ${m}` : m;
    if (ctx.measureText(essai).width > largeur && l) { res.push(l); l = m; } else l = essai;
  }
  if (l) res.push(l);
  return res;
}

/** Retire les balises du texte enrichi (devises). */
const brut = (html) => html.replace(/<[^>]+>/g, '\n').split('\n').map((s) => s.trim()).filter(Boolean);

/**
 * Dessine un carton [debut, fin, texte, style, html?] avec l'opacité `a`, sur un calque de l × h.
 */
export function dessinerCarton(ctx, carton, a, l, h) {
  const [, , texte, style, html] = carton;
  const u = h / 1080;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, a));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const bas = h * 0.86;
  const largeur = l * 0.72;
  // une ombre douce en bas de l'image : le texte se lit sur tous les fonds, même en plein soleil
  if (style !== 'tele' && style !== 'pub') {
    const g = ctx.createLinearGradient(0, h * 0.62, 0, h);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = g; ctx.fillRect(0, h * 0.62, l, h * 0.38);
  }
  if (style === 'tele') {
    ctx.font = police('texte', Math.round(40 * u));
    const ls = lignes(ctx, texte, largeur);
    const lh = 52 * u;
    const w = Math.max(...ls.map((x) => ctx.measureText(x).width)) + 44 * u;
    ls.forEach((ligne, i) => {
      const y = bas - (ls.length - 1 - i) * lh;
      ctx.fillStyle = 'rgba(10,10,14,0.78)';
      ctx.fillRect(l / 2 - w / 2, y - lh / 2, w, lh);
      ctx.fillStyle = '#fff';
      ctx.fillText(ligne, l / 2, y + 2 * u);
    });
  } else if (style === 'pub') {
    ctx.font = police('titre', Math.round(48 * u));
    const w = ctx.measureText(texte).width + 60 * u;
    ctx.translate(l / 2, bas); ctx.rotate(-0.025);
    ctx.fillStyle = C.encre; ctx.fillRect(-w / 2 - 5 * u, -40 * u, w + 10 * u, 80 * u);
    ctx.fillStyle = C.rouge; ctx.fillRect(-w / 2, -35 * u, w, 70 * u);
    ctx.fillStyle = C.creme; ctx.fillText(texte, 0, 3 * u);
  } else if (style === 'radio') {
    ctx.font = police('machine', Math.round(40 * u));
    const ls = lignes(ctx, '📻  ' + texte, largeur);
    ls.forEach((ligne, i) => {
      const y = bas - (ls.length - 1 - i) * 54 * u;
      ctx.shadowColor = 'rgba(255,160,40,0.55)'; ctx.shadowBlur = 16 * u;
      ctx.fillStyle = '#ffcf7a';
      ctx.fillText(ligne, l / 2, y);
      ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 6 * u; ctx.shadowOffsetY = 2 * u;
      ctx.fillText(ligne, l / 2, y);
      ctx.shadowOffsetY = 0;
    });
  } else if (style === 'devise') {
    const [nom, devise] = brut(html || texte);
    ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 14 * u;
    ctx.font = police('titre', Math.round(58 * u));
    ctx.fillStyle = C.creme;
    ctx.fillText((nom || '').toUpperCase(), l / 2, bas - 52 * u);
    ctx.font = 'italic ' + police('texte', Math.round(44 * u));
    ctx.fillText(devise || '', l / 2, bas + 10 * u);
  } else if (style === 'toi') {
    ctx.font = police('main', Math.round(64 * u));
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 16 * u;
    ctx.fillStyle = '#fff3d6';
    ctx.fillText(texte, l / 2, bas);
  } else {
    // le récit : sobre, crème, en italique
    ctx.font = 'italic ' + police('texte', Math.round(46 * u));
    const ls = lignes(ctx, texte, largeur);
    ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 14 * u;
    ctx.fillStyle = C.creme;
    ls.forEach((ligne, i) => ctx.fillText(ligne, l / 2, bas - (ls.length - 1 - i) * 58 * u));
  }
  ctx.restore();
}
