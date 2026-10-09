/* Watt Now? — intro 3D : les images peintes (écrans, affiches, étiquettes), en SVG ou en canvas 2D,
   posées comme textures sur les objets 3D. Les écrans animés sont redessinés à chaque image. */

import { THREE } from '../vendor/rendu-jeu.js';
import { C, watty, logo, soleil } from '../src/dessins.js';

/** Charge un SVG (chaîne) dans une image. */
export function imageSVG(svg) {
  return new Promise((ok, ko) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = ko;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

const IMAGES = new Map();
/** Précharge toutes les images SVG de l'intro (à appeler une fois avant de jouer). */
export async function prechargerImages() {
  const liste = {
    watty: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 170" width="600" height="680">${watty('salut')}</svg>`,
    wattyClin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 170" width="600" height="680">${watty('clin')}</svg>`,
    wattyFige: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 170" width="600" height="680">${watty('fige')}</svg>`,
    wattyPanne: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 170" width="600" height="680">${watty('panne')}</svg>`,
    logo: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 108" width="1200" height="432">${logo()}</svg>`,
    soleil: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-110 -110 220 220" width="256" height="256">${soleil(0, 0, 56)}</svg>`,
  };
  await Promise.all(Object.entries(liste).map(async ([k, svg]) => IMAGES.set(k, await imageSVG(svg))));
}
export const image = (k) => IMAGES.get(k);

/** Une toile 2D animée, utilisable comme texture : dessin(ctx, t, l, h) appelé à chaque maj(t). */
export function toile(l, h, dessin, o = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = l; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  if (o.repeter) { texture.wrapS = texture.wrapT = THREE.RepeatWrapping; }
  let dernier = null;
  return {
    texture, canvas, ctx,
    maj(t) {
      if (o.fixe && dernier !== null) return;
      if (o.pas && dernier !== null && Math.abs(t - dernier) < o.pas) return;
      dernier = t;
      ctx.save();
      dessin(ctx, t, l, h);
      ctx.restore();
      texture.needsUpdate = true;
    },
  };
}

export const POLICE = {
  titre: "900 {t}px Futura, 'Avenir Next Condensed', 'Arial Black', sans-serif",
  texte: "600 {t}px 'Avenir Next', 'Segoe UI', system-ui, sans-serif",
  machine: "700 {t}px 'American Typewriter', 'Courier New', monospace",
  main: "700 {t}px 'Marker Felt', 'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive",
};
export const police = (genre, taille) => POLICE[genre].replace('{t}', taille);

const rebond = (k) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const seg = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));

/** Des rayons d'affiche qui tournent. */
function rayons(ctx, cx, cy, n, a, c1, c2, r = 3000) {
  ctx.fillStyle = c1; ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.fillStyle = c2;
  for (let i = 0; i < n; i++) {
    const b = a + (i * 2 * Math.PI) / n;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(b) * r, cy + Math.sin(b) * r);
    ctx.lineTo(cx + Math.cos(b + Math.PI / n) * r, cy + Math.sin(b + Math.PI / n) * r);
    ctx.closePath(); ctx.fill();
  }
}

/** L'indicatif d'Abondance TV (l'écran de la télé du salon, au début). */
export function ecranIndicatif() {
  return toile(1024, 768, (ctx, t, l, h) => {
    rayons(ctx, l / 2, h / 2, 18, t * 0.2, C.rouge, '#d94a3a');
    ctx.beginPath(); ctx.arc(l / 2, h / 2, 250, 0, Math.PI * 2); ctx.fillStyle = C.creme; ctx.fill();
    ctx.lineWidth = 10; ctx.strokeStyle = C.encre; ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = C.rouge; ctx.font = police('titre', 92); ctx.fillText('ABONDANCE', l / 2, h / 2 - 10, 440);
    ctx.fillStyle = C.encre; ctx.font = police('titre', 120); ctx.fillText('TV', l / 2, h / 2 + 105);
    const w = image('watty');
    const k = rebond(seg(t, 0.3, 0.9));
    if (w) { ctx.save(); ctx.translate(l * 0.82, h * 0.42); ctx.rotate(Math.sin(t * 6) * 0.12); ctx.scale(k, k); ctx.drawImage(w, -100, -115, 200, 227); ctx.restore(); }
    ctx.fillStyle = C.creme; ctx.fillRect(l / 2 - 330, h - 120, 660, 70);
    ctx.fillStyle = C.canard; ctx.font = 'italic ' + police('texte', 40); ctx.fillText('La chaîne qui pense pour vous', l / 2, h - 72);
  });
}

/** Un écran de veille de chaîne (ce que montre la télé du salon pendant « Bien-être »). */
export function ecranBienEtre() {
  return toile(1024, 768, (ctx, t, l, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#7fd0c8'); g.addColorStop(1, '#2f7f8a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, l, h);
    for (let i = 0; i < 6; i++) {
      ctx.beginPath(); ctx.arc(l / 2 + Math.sin(t * 0.7 + i) * 280, h / 2 + Math.cos(t * 0.5 + i * 2) * 160, 80 + i * 20, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.06 + i * 0.01})`; ctx.fill();
    }
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = police('titre', 84); ctx.fillText('BIEN-ÊTRE', l / 2, h / 2 + 10);
    ctx.font = 'italic ' + police('texte', 40); ctx.fillText('Respirez… on s\'occupe du reste.', l / 2, h / 2 + 80);
  });
}

/**
 * La réclame de Watty, avec « WATT » et « NOW? » calés sur la voix du jingle (3,18 s et 3,64 s), puis la coupure :
 * l'image se déchire, Watty se fige à mi-clin d'œil, et le tube s'éteint (trait, puis point).
 * t : secondes depuis le début du thème principal ; tc : instant de la coupure.
 */
export function ecranReclame(tc) {
  return toile(1024, 768, (ctx, t, l, h) => {
    const coupe = t >= tc;
    const u = t - tc;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, l, h);
    if (coupe && u > 0.78) {
      // le point blanc qui s'efface
      const k = 1 - seg(u, 0.8, 1.9);
      if (k > 0) { const g = ctx.createRadialGradient(l / 2, h / 2, 0, l / 2, h / 2, 40 * k + 4); g.addColorStop(0, `rgba(255,255,255,${k})`); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, l, h); }
      return;
    }
    ctx.save();
    if (coupe) {
      const v = seg(u, 0.45, 0.62), w = seg(u, 0.62, 0.78);
      ctx.translate(l / 2, h / 2); ctx.scale(Math.max(0.003, 1 - w), Math.max(0.006, 1 - v)); ctx.translate(-l / 2, -h / 2);
      if (u < 0.45) ctx.translate(Math.sin(u * 55) * 30, 0);
    }
    rayons(ctx, l * 0.32, h * 0.55, 16, Math.min(t, tc) * 0.12, C.creme, '#f8d9a0');
    ctx.fillStyle = C.rouge; ctx.fillRect(0, 0, l, 90);
    ctx.fillStyle = C.creme; ctx.textAlign = 'center'; ctx.font = police('titre', 46); ctx.fillText('LA COMPAGNIE PRÉSENTE', l / 2, 62);
    const wi = image(coupe ? 'wattyFige' : (Math.floor(t * 2.2) % 3 === 2 ? 'wattyClin' : 'watty'));
    if (wi) { ctx.save(); ctx.translate(l * 0.3, h * 0.56 - (coupe ? 0 : Math.abs(Math.sin(t * 4.4)) * 14)); ctx.drawImage(wi, -190, -215, 380, 430); ctx.restore(); }
    const kw = rebond(seg(t, 3.12, 3.42)), kn = rebond(seg(t, 3.6, 3.95));
    ctx.save(); ctx.translate(l * 0.72, h * 0.44); ctx.scale(kw, kw); ctx.font = police('titre', 150); ctx.lineWidth = 10; ctx.strokeStyle = C.encre; ctx.strokeText('WATT', 0, 0); ctx.fillStyle = C.rouge; ctx.fillText('WATT', 0, 0); ctx.restore();
    ctx.save(); ctx.translate(l * 0.72, h * 0.66); ctx.rotate(kn > 0.9 ? -0.06 : 0); ctx.scale(kn, kn); ctx.font = police('titre', 150); ctx.fillStyle = C.encre; ctx.fillText('NOW?', 0, 0); ctx.restore();
    ctx.fillStyle = C.canard; ctx.fillRect(0, h - 100, l, 100);
    ctx.fillStyle = C.creme; ctx.font = 'italic ' + police('texte', 44); ctx.fillText('Toujours plein, jamais à plat !', l / 2, h - 36);
    if (coupe && u < 0.45) {
      for (let i = 0; i < 14; i++) { ctx.fillStyle = i % 3 ? 'rgba(255,255,255,0.5)' : 'rgba(80,120,255,0.5)'; ctx.fillRect(Math.sin(u * 70 + i * 2.1) * 120, i * 56, l, 18 + (i * 37) % 30); }
    }
    if (coupe) { ctx.fillStyle = `rgba(255,255,255,${seg(u, 0.4, 0.62)})`; ctx.fillRect(0, 0, l, h); }
    ctx.restore();
  });
}

/** La carte de la météo, avec ses soleils qui poussent un à un. */
export function ecranMeteo() {
  return toile(1024, 640, (ctx, t, l, h) => {
    ctx.fillStyle = C.canard; ctx.fillRect(0, 0, l, h);
    ctx.save(); ctx.globalAlpha = 0.15; ctx.strokeStyle = '#fff'; ctx.lineWidth = 26;
    for (let i = -4; i < 14; i++) { ctx.beginPath(); ctx.moveTo(i * 90, h); ctx.lineTo(i * 90 + 400, 0); ctx.stroke(); }
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(250, 110); ctx.bezierCurveTo(360, 60, 520, 90, 600, 70); ctx.bezierCurveTo(720, 50, 820, 120, 840, 220);
    ctx.bezierCurveTo(860, 320, 820, 420, 760, 500); ctx.bezierCurveTo(660, 590, 480, 560, 380, 580);
    ctx.bezierCurveTo(260, 590, 180, 520, 190, 420); ctx.bezierCurveTo(200, 320, 160, 200, 250, 110); ctx.closePath();
    ctx.fillStyle = C.creme; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = C.encre; ctx.stroke();
    ctx.strokeStyle = '#6fb4c7'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(300, 150); ctx.bezierCurveTo(360, 280, 320, 380, 420, 470); ctx.stroke();
    const s = image('soleil');
    [[360, 200], [560, 260], [700, 180], [470, 420], [680, 430]].forEach(([x, y], i) => {
      const k = rebond(seg(t, 0.3 + i * 0.22, 0.75 + i * 0.22));
      if (k <= 0 || !s) return;
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.4); ctx.scale(k * 0.55, k * 0.55); ctx.drawImage(s, -128, -128); ctx.restore();
    });
    ctx.fillStyle = C.creme; ctx.font = police('titre', 54); ctx.textAlign = 'left'; ctx.fillText('DEMAIN', 40, h - 40);
    ctx.fillStyle = C.jaune; ctx.fillText('32°', l - 170, h - 40);
  });
}

/** La montre connectée : « Pensez à cligner des yeux », puis « Bravo ! 12 pas aujourd'hui ». t2 : instant du « Bravo ». */
export function ecranMontre(t1, t2) {
  return toile(512, 512, (ctx, t, l, h) => {
    ctx.fillStyle = '#05080d'; ctx.fillRect(0, 0, l, h);
    ctx.textAlign = 'center';
    if (t < t1) {
      ctx.fillStyle = '#9fb1c4'; ctx.font = police('texte', 120); ctx.fillText('21:47', l / 2, h / 2 + 40);
      return;
    }
    const k = rebond(seg(t, t1, t1 + 0.35));
    ctx.save(); ctx.translate(l / 2, h / 2); ctx.scale(k, k); ctx.translate(-l / 2, -h / 2);
    if (t < t2) {
      ctx.beginPath(); ctx.arc(l / 2, 150, 70, 0, Math.PI * 2); ctx.fillStyle = '#2c6fd6'; ctx.fill();
      const cligne = Math.abs(Math.sin(t * 3)) < 0.15 ? 0.15 : 1;
      ctx.beginPath(); ctx.ellipse(l / 2, 150, 44, 26 * cligne, 0, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.beginPath(); ctx.arc(l / 2, 150, 13 * cligne, 0, Math.PI * 2); ctx.fillStyle = '#0e141c'; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = police('texte', 46); ctx.fillText('Pensez à cligner', l / 2, 290); ctx.fillText('des yeux', l / 2, 345);
      ctx.fillStyle = '#2c6fd6'; ctx.beginPath(); ctx.roundRect(l / 2 - 120, 385, 240, 64, 32); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = police('texte', 34); ctx.fillText('C\'est fait', l / 2, 429);
    } else {
      ctx.font = police('texte', 130); ctx.fillText('🏆', l / 2, 200);
      ctx.fillStyle = '#7bd06a'; ctx.font = police('titre', 64); ctx.fillText('Bravo !', l / 2, 300);
      ctx.fillStyle = '#fff'; ctx.font = police('texte', 46); ctx.fillText('12 pas aujourd\'hui', l / 2, 370);
      ctx.fillStyle = '#9fb1c4'; ctx.font = police('texte', 34); ctx.fillText('Objectif atteint', l / 2, 425);
    }
    ctx.restore();
  });
}

/** L'écran du frigo connecté : « Mise à jour requise », bloqué à 99 %, puis plus rien. tMort : il s'éteint. */
export function ecranFrigo(tMort) {
  return toile(512, 340, (ctx, t, l, h) => {
    const k = t > tMort - 0.4 && t < tMort ? (Math.sin(t * 70) > 0 ? 1 : 0.15) : t >= tMort ? 0 : 1;
    ctx.fillStyle = '#05070a'; ctx.fillRect(0, 0, l, h);
    if (k <= 0) return;
    ctx.globalAlpha = k;
    ctx.fillStyle = '#1f6fbf'; ctx.fillRect(0, 0, l, h);
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = police('texte', 40); ctx.fillText('Mise à jour requise', l / 2, 90);
    ctx.fillStyle = '#d6e8ff'; ctx.font = police('texte', 30); ctx.fillText('Veuillez patienter…', l / 2, 145);
    ctx.fillStyle = '#0d3c6a'; ctx.beginPath(); ctx.roundRect(60, 190, l - 120, 30, 15); ctx.fill();
    ctx.fillStyle = '#7fd0ff'; ctx.beginPath(); ctx.roundRect(60, 190, (l - 120) * 0.99, 30, 15); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = police('texte', 32); ctx.fillText('99 %', l / 2, 280);
  });
}

/** L'écran d'un téléphone : la lueur bleue, « Batterie faible », puis noir. */
export function ecranTelephone(tFaible, tMort) {
  return toile(256, 512, (ctx, t, l, h) => {
    const mort = t >= tMort;
    const clignote = t > tFaible && !mort ? (Math.sin(t * 30) > 0 ? 1 : 0.35) : mort ? 0 : 1;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, l, h);
    if (clignote <= 0) return;
    ctx.globalAlpha = clignote;
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#9fd8ff'); g.addColorStop(1, '#4a7ad0');
    ctx.fillStyle = g; ctx.fillRect(0, 0, l, h);
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
    if (t > tFaible) {
      ctx.font = police('texte', 34); ctx.fillText('Batterie', l / 2, h / 2 - 10); ctx.fillText('faible', l / 2, h / 2 + 30);
      ctx.fillStyle = '#ff4b3a'; ctx.fillRect(l / 2 - 50, h / 2 + 60, 12, 30); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.strokeRect(l / 2 - 54, h / 2 + 56, 100, 38);
      ctx.fillStyle = '#fff'; ctx.font = police('texte', 28); ctx.fillText('1 %', l / 2, h / 2 + 140);
    } else {
      ctx.font = police('texte', 70); ctx.fillText('22:13', l / 2, 130);
      for (let i = 0; i < 4; i++) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.roundRect(24, 190 + i * 74, l - 48, 58, 12); ctx.fill(); }
    }
  });
}

/** Une étiquette peinte (enseigne, panneau, prix) : fond, texte, bordure ; renvoie une texture fixe. */
export function etiquette(texte, o = {}) {
  const l = o.l || 1024, h = o.h || 256;
  return toile(l, h, (ctx) => {
    ctx.fillStyle = o.fond || C.creme; ctx.fillRect(0, 0, l, h);
    if (o.bord !== false) { ctx.lineWidth = o.trait || 16; ctx.strokeStyle = o.encre || C.encre; ctx.strokeRect(8, 8, l - 16, h - 16); }
    ctx.fillStyle = o.couleur || C.rouge; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = police(o.police || 'titre', o.taille || 120);
    const lignes = String(texte).split('\n');
    lignes.forEach((ligne, i) => ctx.fillText(ligne, l / 2, h / 2 + (i - (lignes.length - 1) / 2) * (o.taille || 120) * 1.05, l - 60));
  }, { fixe: true });
}

/** L'étoile de prix du téléachat. */
export function etoilePrix() {
  return toile(512, 512, (ctx, t, l, h) => {
    ctx.clearRect(0, 0, l, h);
    ctx.translate(l / 2, h / 2);
    ctx.beginPath();
    for (let i = 0; i < 32; i++) { const a = (i * Math.PI) / 16, r = i % 2 ? 190 : 250; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.fillStyle = C.jaune; ctx.fill(); ctx.lineWidth = 12; ctx.strokeStyle = C.encre; ctx.stroke();
    ctx.textAlign = 'center'; ctx.fillStyle = C.encre; ctx.font = police('titre', 54); ctx.fillText('SEULEMENT', 0, -50);
    ctx.fillStyle = C.rouge; ctx.font = police('titre', 108); ctx.fillText('900 Wh', 0, 50);
    ctx.fillStyle = C.encre; ctx.font = police('titre', 50); ctx.fillText('le bol !', 0, 115);
  }, { fixe: true });
}

/** Le feutre sur l'affiche : « WATTY MENT ! », une croix, « Réfléchis. C\'est gratuit. », tracés dans le temps. */
export function feutre() {
  return toile(1024, 1024, (ctx, t, l, h) => {
    ctx.clearRect(0, 0, l, h);
    ctx.strokeStyle = '#1d2a5c'; ctx.fillStyle = '#1d2a5c'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const a = seg(t, 0.4, 1.9);
    if (a > 0) {
      ctx.save(); ctx.translate(330, 740); ctx.rotate(-0.1);
      ctx.font = police('main', 92); ctx.lineWidth = 7;
      ctx.setLineDash([3000 * a, 3000]); ctx.strokeText('WATTY MENT !', 0, 0);
      if (a >= 1) { ctx.setLineDash([]); ctx.fillText('WATTY MENT !', 0, 0); }
      ctx.restore();
    }
    const b = seg(t, 2.0, 2.7);
    if (b > 0) {
      ctx.lineWidth = 22; ctx.beginPath();
      const L = 600;
      ctx.moveTo(90, 250); ctx.lineTo(90 + 380 * Math.min(1, b * 2), 250 + 500 * Math.min(1, b * 2));
      if (b > 0.5) { const k = (b - 0.5) * 2; ctx.moveTo(470, 250); ctx.lineTo(470 - 380 * k, 250 + 500 * k); }
      ctx.stroke();
      void L;
    }
    const c = seg(t, 3.0, 4.2);
    if (c > 0) {
      ctx.save(); ctx.translate(60, 965); ctx.rotate(-0.04); ctx.font = police('main', 76);
      ctx.beginPath(); ctx.rect(-20, -120, 900 * c, 160); ctx.clip(); ctx.fillText('Réfléchis. C\'est gratuit.', 0, 0); ctx.restore();
    }
  });
}
