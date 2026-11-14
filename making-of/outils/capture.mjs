#!/usr/bin/env node
/* Watt Now? — export vidéo du making-of (repris de intro/outils/capture.mjs).
   Pilote Chrome sans fenêtre (protocole DevTools) sur capture.html : chaque image est rendue au temps exact
   (30 images/s, déterministe), récupérée en JPEG ; ffmpeg assemble avec la bande-son (assets/musique/bande.wav).

   Usage : node making-of/outils/capture.mjs [--depuis 0] [--jusqua 31.4] [--planche] [--pas 1] [--l 1920 --h 1080]
     --planche : une planche-contact (une image toutes les `--pas` secondes) au lieu de la vidéo
     --rapide  : un brouillon (960 × 540, sans suréchantillonnage ni flou de mouvement, qualité basse)

   Le serveur du making-of doit tourner (http://localhost:8794, entrée « making-of » de .claude/launch.json).
   Tout est écrit dans making-of/ : making-of/.travail/ (images, profil de Chrome) et making-of/video/ (le résultat). */

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (nom, def) => { const i = args.indexOf(`--${nom}`); return i >= 0 ? args[i + 1] : def; };
const planche = args.includes('--planche');
const rapide = args.includes('--rapide');
const IPS = Number(opt('ips', 30));
const L = Number(opt('l', planche ? 640 : rapide ? 960 : 1920)), H = Number(opt('h', planche ? 360 : rapide ? 540 : 1080));
const PORT = 9334;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TRAVAIL = join(ICI, '.travail', `capture${planche ? '-planche' : rapide ? '-brouillon' : ''}`);
const PROFIL = join(ICI, '.travail', 'chrome');
const SORTIE = join(ICI, 'video');

mkdirSync(TRAVAIL, { recursive: true });
mkdirSync(PROFIL, { recursive: true });
mkdirSync(SORTIE, { recursive: true });

const attendre = (ms) => new Promise((ok) => setTimeout(ok, ms));

// ---------------------------------------------------------------- Chrome sans fenêtre
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFIL}`,
  `--window-size=${L},${H}`, '--hide-scrollbars', '--mute-audio', '--no-first-run', '--no-default-browser-check',
  '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--use-angle=metal', '--autoplay-policy=no-user-gesture-required',
  'about:blank',
], { stdio: 'ignore' });
process.on('exit', () => chrome.kill());

let cible = null;
for (let i = 0; i < 50 && !cible; i++) {
  await attendre(200);
  try {
    const liste = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    cible = liste.find((c) => c.type === 'page');
  } catch (e) { /* pas encore prêt */ }
}
if (!cible) { console.error('Chrome ne répond pas.'); process.exit(1); }

const ws = new WebSocket(cible.webSocketDebuggerUrl);
await new Promise((ok, ko) => { ws.onopen = ok; ws.onerror = ko; });
let id = 0;
const attente = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && attente.has(m.id)) { const { ok, ko } = attente.get(m.id); attente.delete(m.id); m.error ? ko(new Error(m.error.message)) : ok(m.result); }
};
// chaque échange a un délai maximal : si la page a planté, on le saura au lieu d'attendre pour toujours
const cdp = (method, params = {}) => new Promise((ok, ko) => {
  const n = ++id;
  const minuteur = setTimeout(() => { attente.delete(n); ko(new Error(`Chrome ne répond plus (${method})`)); }, 180000);
  attente.set(n, { ok: (r) => { clearTimeout(minuteur); ok(r); }, ko: (e) => { clearTimeout(minuteur); ko(e); } });
  try { ws.send(JSON.stringify({ id: n, method, params })); } catch (e) { clearTimeout(minuteur); ko(e); }
});
ws.onclose = () => { for (const { ko } of attente.values()) ko(new Error('Chrome a fermé la connexion')); attente.clear(); };
const evaluer = async (expression, attendrePromesse = false) => {
  const r = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: attendrePromesse });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
};

await cdp('Page.enable');
await cdp('Runtime.enable');
await cdp('Emulation.setDeviceMetricsOverride', { width: L, height: H, deviceScaleFactor: 1, mobile: false });
// (re)charge la page de capture ; resservi si la page plante en route (mémoire du GPU)
async function charger() {
  await cdp('Page.navigate', { url: `http://localhost:8794/capture.html?l=${L}&h=${H}&ss=${planche || rapide ? 1 : Number(opt('ss', 2))}${rapide ? '&qualite=basse' : ''}` });
  for (let i = 0; i < 300; i++) {
    await attendre(200);
    try { if (await evaluer('window.capture && window.capture.pret === true')) return; } catch (e) { /* la page charge */ }
  }
  throw new Error('La page de capture ne se charge pas.');
}
await charger();
const fin = Number(opt('jusqua', await evaluer('capture.fin')));
const depuis = Number(opt('depuis', 0));
console.log(`Capture du making-of : ${depuis} → ${fin.toFixed(1)} s, ${L}×${H}${planche ? ' (planche)' : `, ${IPS} i/s`}`);

// ---------------------------------------------------------------- Les images
const pas = planche ? Number(opt('pas', 2)) : 1 / IPS;
const total = Math.floor((fin - depuis) / pas);
const t0 = Date.now();
// on « chauffe » les plans au début (comme dans le jeu) : le premier rendu d'un plan le construit
// --reprendre : on garde les images déjà rendues et on repart de la première qui manque (la dernière est refaite)
let premiere = 0;
if (args.includes('--reprendre')) {
  while (existsSync(join(TRAVAIL, `${String(premiere).padStart(5, '0')}.jpg`))) premiere++;
  premiere = Math.max(0, premiere - 1);
  console.log(`  reprise à l'image ${premiere}`);
}
for (let i = premiere; i <= total; i++) {
  const T = depuis + i * pas;
  if (planche) {
    // pour une image juste, on joue quelques images avant (le feu, la fumée, les particules ont une mémoire)
    for (let k = 8; k > 0; k--) await evaluer(`capture.rendre(${T - k / 30}, ${1 / 30})`);
  }
  const rendre = () => evaluer(planche || rapide ? `capture.rendre(${T}, ${pas}); capture.image(${planche ? 0.85 : 0.9})` : `capture.rendreFlou(${T}, ${pas}, ${Number(opt('flou', 6))}); capture.image(0.93)`);
  let b64;
  for (let essai = 0; ; essai++) {
    try { b64 = await rendre(); break; } catch (e) {
      if (essai >= 3) throw e;
      console.log(`\n  la page a lâché à l'image ${i} (${e.message.split('\n')[0]}) : on la recharge`);
      await charger();
      // les particules et le feu ont une mémoire : on rejoue un peu avant
      for (let k = 30; k > 0; k--) await evaluer(`capture.rendre(${T - k / 30}, ${1 / 30})`);
    }
  }
  writeFileSync(join(TRAVAIL, `${String(i).padStart(5, '0')}.jpg`), Buffer.from(b64, 'base64'));
  if (i % 60 === 0) {
    const ecoule = (Date.now() - t0) / 1000;
    process.stdout.write(`\r  image ${i}/${total} (T = ${T.toFixed(1)} s) — ${ecoule.toFixed(0)} s écoulées, reste ≈ ${((ecoule / Math.max(1, i)) * (total - i)).toFixed(0)} s   `);
  }
}
console.log('\n  images : terminé');

const ffmpeg = (a) => new Promise((ok, ko) => { const p = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...a], { stdio: 'inherit' }); p.on('exit', (c) => (c === 0 ? ok() : ko(new Error(`ffmpeg ${c}`)))); });

if (planche) {
  // une planche-contact : 6 images par ligne, le temps écrit sur chaque vignette
  const sortie = join(SORTIE, 'planche.jpg');
  await ffmpeg(['-framerate', '1', '-i', join(TRAVAIL, '%05d.jpg'), '-vf', `scale=${L / 2}:-1,tile=6x${Math.ceil((total + 1) / 6)}:padding=4:margin=4`, '-frames:v', '1', '-q:v', '3', sortie]);
  console.log(`Planche : ${sortie}`);
  ws.close(); chrome.kill(); process.exit(0);
}

const wav = join(ICI, 'assets', 'musique', 'bande.wav');

// ---------------------------------------------------------------- L'assemblage
const mp4 = join(SORTIE, rapide ? 'watt-now-making-of-brouillon.mp4' : 'watt-now-making-of.mp4');
await ffmpeg([
  '-framerate', String(IPS), '-i', join(TRAVAIL, '%05d.jpg'), '-ss', String(depuis), '-i', wav,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-maxrate', '9M', '-bufsize', '18M', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
  '-c:a', 'aac', '-b:a', '256k', '-shortest', mp4,
]);
console.log(`Vidéo : ${mp4}`);
ws.close();
chrome.kill();
if (!args.includes('--garder')) rmSync(TRAVAIL, { recursive: true, force: true });
process.exit(0);
