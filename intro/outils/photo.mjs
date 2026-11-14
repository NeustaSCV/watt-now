#!/usr/bin/env node
/* Watt Now? — intro : photographie des images figées du labo (mise au point), avec Chrome sans fenêtre.
   node intro/outils/photo.mjs sortie.jpg "plan=essai-mains&t=1" [autre.jpg "m=acte3&t=96" …]
   Les images vont dans intro/.travail/ (chemins relatifs à ce dossier). */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = join(dirname(fileURLToPath(import.meta.url)), '..');
// ou : node photo.mjs --serie sortie.jpg "m=acte3" "80;80.4;80.9|cam=x,y,z,vx,vy,vz,f" [colonnes] : une planche de plusieurs instants
const it = process.argv.indexOf('--taille');   // --taille 390x844 : une autre taille de fenêtre (téléphone)
const [L, H] = it > 0 ? process.argv.splice(it, 2)[1].split('x').map(Number) : [1600, 900];
let paires = process.argv.slice(2);
let serie = null;
if (paires[0] === '--serie') {
  const [, sortie, requete, temps, colonnes = '2'] = paires;
  const liste = temps.split(';');
  serie = { sortie, colonnes: Number(colonnes), images: liste.map((t, i) => `serie-${i}.jpg`) };
  // un instant peut porter sa propre caméra : « 117|cam=… »
  paires = liste.flatMap((t, i) => { const [tt, plus] = t.split('|'); return [serie.images[i], `${requete}&t=${tt}${plus ? `&${plus}` : ''}`]; });
}
const PORT = 9334;
const PROFIL = join(ICI, '.travail', 'chrome-photo');
mkdirSync(PROFIL, { recursive: true });
const attendre = (ms) => new Promise((ok) => setTimeout(ok, ms));
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFIL}`,
  `--window-size=${L},${H}`, '--hide-scrollbars', '--mute-audio', '--no-first-run', '--ignore-gpu-blocklist', '--use-angle=metal', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
process.on('exit', () => chrome.kill());
let cible = null;
for (let i = 0; i < 50 && !cible; i++) { await attendre(200); try { cible = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((c) => c.type === 'page'); } catch (e) { /* */ } }
const ws = new WebSocket(cible.webSocketDebuggerUrl);
await new Promise((ok) => { ws.onopen = ok; });
let id = 0; const attente = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && attente.has(m.id)) { attente.get(m.id)(m); attente.delete(m.id); } };
const cdp = (method, params = {}) => new Promise((ok) => { const n = ++id; attente.set(n, ok); ws.send(JSON.stringify({ id: n, method, params })); });
await cdp('Runtime.enable');
await cdp('Emulation.setDeviceMetricsOverride', { width: L, height: H, deviceScaleFactor: 1, mobile: L < 700 });
for (let i = 0; i < paires.length; i += 2) {
  // « /index.html?fiche=1 » : une page quelconque de l'intro (on attend 3 s) ; sinon une image figée du labo
  const page = paires[i + 1].startsWith('/');
  await cdp('Page.navigate', { url: page ? `http://localhost:8791${paires[i + 1]}` : `http://localhost:8791/labo.html?${paires[i + 1]}` });
  let ok = page;
  if (page) {   // la page est prête quand l'écran d'accueil est là (ou au bout de 3 s pour une page simple)
    const ecr = /ecrans=|accueil/.test(paires[i + 1]);
    const attendu = ecr ? '.wi-ecran' : 'body';
    for (let k = 0; k < 600; k++) { const r = await cdp('Runtime.evaluate', { expression: `!!document.querySelector('${attendu}')`, returnByValue: true }); if (r.result?.result?.value) break; await attendre(200); }
    await attendre(ecr ? 5000 : 3000);
  }
  for (let k = 0; k < 300 && !ok; k++) { await attendre(200); const r = await cdp('Runtime.evaluate', { expression: 'window.pretCapture === true', returnByValue: true }); ok = r.result?.result?.value; }
  const err = await cdp('Runtime.evaluate', { expression: 'window.__erreur || ""', returnByValue: true });
  const r = await cdp('Page.captureScreenshot', { format: 'jpeg', quality: 85, clip: { x: 0, y: 0, width: L, height: H, scale: 1 } });
  writeFileSync(join(ICI, '.travail', paires[i]), Buffer.from(r.result.data, 'base64'));
  console.log(`${paires[i]}${ok ? '' : ' (pas prête)'} ${err.result?.result?.value || ''}`);
}
if (serie) {
  const { execFileSync } = await import('node:child_process');
  const n = serie.images.length, c = Math.min(serie.colonnes, n);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...serie.images.flatMap((f) => ['-i', join(ICI, '.travail', f)]),
    '-filter_complex', `${serie.images.map((_, i) => `[${i}]`).join('')}concat=n=${n}:v=1,scale=${c > 2 ? 640 : 800}:-1,tile=${c}x${Math.ceil(n / c)}`, '-frames:v', '1', join(ICI, '.travail', serie.sortie)]);
}
ws.close(); chrome.kill(); process.exit(0);
