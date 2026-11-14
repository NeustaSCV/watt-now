/* Watt Now? — intro : petits outils communs (temps, courbes, SVG). */

export const NS = 'http://www.w3.org/2000/svg';

/** Borne x entre a et b. */
export const borne = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
/** Interpolation linéaire. */
export const lerp = (a, b, k) => a + (b - a) * k;
/** Avancement 0 → 1 de t entre a et b (borné). */
export const seg = (t, a, b) => borne((t - a) / (b - a));
/** Courbes d'accélération. */
export const doux = (k) => k * k * (3 - 2 * k);
export const sortie = (k) => 1 - Math.pow(1 - k, 3);
export const entree = (k) => k * k * k;
/** Rebond léger en fin de course (pour les arrivées de titre, de tampon). */
export const rebond = (k) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
};
/** Apparition puis disparition : 0 avant a, 1 entre a+f et b-f, 0 après b. */
export const fenetre = (t, a, b, f = 0.4) => Math.min(seg(t, a, a + f), 1 - seg(t, b - f, b));

/** Générateur pseudo-aléatoire déterministe (la même image à chaque lecture). */
export function hasard(graine = 1) {
  let s = graine >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

/** Crée un groupe SVG à partir d'un balisage ; renvoie le groupe et un accès par data-id. */
export function groupe(balisage, attrs = {}) {
  const g = document.createElementNS(NS, 'g');
  for (const [k, v] of Object.entries(attrs)) g.setAttribute(k, v);
  g.innerHTML = balisage;
  const cache = new Map();
  const $ = (id) => {
    if (!cache.has(id)) cache.set(id, g.querySelector(`[data-id="${id}"]`));
    return cache.get(id);
  };
  return { g, $ };
}

/** Pose une transformation (translation, rotation en degrés, échelle) sur un élément. */
export function place(el, x = 0, y = 0, r = 0, s = 1) {
  if (!el) return;
  el.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${r.toFixed(2)}) scale(${typeof s === 'number' ? s.toFixed(4) : s})`);
}

export function opacite(el, o) {
  if (el) el.setAttribute('opacity', borne(o).toFixed(3));
}

export function visible(el, oui) {
  if (el) el.style.display = oui ? '' : 'none';
}

/** Échappe un texte pour l'insérer dans du HTML. */
export const echappe = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
