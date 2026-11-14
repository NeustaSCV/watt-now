#!/usr/bin/env node
/* Watt Now? — intro : les personnages en haute définition, pour la cinématique.
   Même chaîne que code/scripts/preparer-personnages.mjs (packs CC0 de Quaternius, download/, lus sans les modifier),
   mais sans simplification : maillages complets, textures de couleur en 2048², cartes de relief gardées (2048²),
   cheveux en 1024². Les animations restent celles du jeu (copiées par empaqueter.sh).
   Écrit dans intro/.travail/personnages/ (décompression) et intro/assets/personnages/ (résultat).

   node intro/outils/preparer-personnages-hd.mjs */

import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const ICI = join(dirname(fileURLToPath(import.meta.url)), '..');
const RACINE = join(ICI, '..');
const CODE = join(RACINE, 'code');
const exiger = createRequire(join(CODE, 'package.json'));
const charger = async (nom) => import(pathToFileURL(exiger.resolve(nom)).href);
const { NodeIO } = await charger('@gltf-transform/core');
const { ALL_EXTENSIONS } = await charger('@gltf-transform/extensions');
const { dedup, meshopt, prune, quantize, weld } = await charger('@gltf-transform/functions');
const { MeshoptEncoder } = await charger('meshoptimizer');

const travail = join(ICI, '.travail', 'personnages');
const sortie = join(ICI, 'assets', 'personnages');
mkdirSync(travail, { recursive: true });
mkdirSync(sortie, { recursive: true });

const zip = join(RACINE, 'download', 'Universal Base Characters[Standard].zip');
const dossierPack = join(travail, 'corps');
if (!existsSync(dossierPack)) {
  mkdirSync(dossierPack, { recursive: true });
  execFileSync('unzip', ['-q', '-o', zip, '-d', dossierPack]);
}
const fichiers = readdirSync(dossierPack, { recursive: true }).map(String);
const trouver = (nom) => join(dossierPack, fichiers.find((f) => basename(f) === nom));
const dossierCorps = dirname(trouver('Superhero_Female_FullBody.gltf'));
const dossierCheveux = dirname(join(dossierPack, fichiers.find((f) => f.includes('Origin at 0') && f.endsWith('Hair_Buns.gltf'))));

function image(png, taille, format) {
  const ext = format === 'jpeg' ? 'jpg' : 'png';
  const out = join(travail, 'textures', `${basename(png, '.png')}_${taille}.${ext}`);
  mkdirSync(dirname(out), { recursive: true });
  if (!existsSync(out)) execFileSync('sips', ['-s', 'format', format, ...(format === 'jpeg' ? ['-s', 'formatOptions', '90'] : []), '-Z', String(taille), png, '--out', out], { stdio: 'ignore' });
  return readFileSync(out);
}

function boucherImages(gltf) {
  const json = JSON.parse(readFileSync(gltf, 'utf8'));
  const dossier = dirname(gltf);
  const bouche = readdirSync(dossier).find((f) => f.endsWith('.png'));
  for (const im of json.images ?? []) {
    if (!im.uri) continue;
    const chemin = join(dossier, decodeURIComponent(im.uri));
    if (!existsSync(chemin) && bouche) copyFileSync(join(dossier, bouche), chemin);
  }
  return gltf;
}

await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });

/** Couleur en JPEG 2048², relief gardé (PNG), pas de carte métal/rugosité (le jeu règle la rugosité). */
function preparer(doc, dossier, taille, relief) {
  for (const m of doc.getRoot().listMaterials()) {
    m.setMetallicRoughnessTexture(null);
    m.setMetallicFactor(0);
    m.setRoughnessFactor(0.75);
    const c = m.getBaseColorTexture();
    if (c) {
      const nom = c.getURI() ? basename(c.getURI()) : `${c.getName()}.png`;
      const png = join(dossier, nom);
      if (existsSync(png)) c.setImage(image(png, taille, 'jpeg')).setMimeType('image/jpeg').setURI(nom.replace(/\.png$/, '.jpg'));
    }
    const n = m.getNormalTexture();
    if (n && relief) {
      const nom = n.getURI() ? basename(n.getURI()) : `${n.getName()}.png`;
      const png = join(dossier, nom);
      if (existsSync(png) && statSync(png).size > 2000) n.setImage(image(png, taille, 'png')).setMimeType('image/png').setURI(nom);
      else m.setNormalTexture(null);
    } else m.setNormalTexture(null);
  }
}

async function ecrire(doc, nom) {
  await doc.transform(prune(), dedup(), weld(), quantize({ quantizeNormal: 12, quantizeTexcoord: 14, quantizePosition: 16 }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  const chemin = join(sortie, nom);
  await io.write(chemin, doc);
  return `${nom} : ${(statSync(chemin).size / 1024).toFixed(0)} Ko`;
}

const rapport = [];
for (const [genre, fichier] of [['femme', 'Superhero_Female_FullBody.gltf'], ['homme', 'Superhero_Male_FullBody.gltf']]) {
  const doc = await io.read(boucherImages(join(dossierCorps, fichier)));
  preparer(doc, dossierCorps, 2048, true);
  rapport.push(await ecrire(doc, `corps_${genre}.glb`));
}
for (const nom of ['Hair_Buns', 'Hair_Long', 'Hair_SimpleParted', 'Hair_Buzzed', 'Hair_BuzzedFemale', 'Hair_Beard']) {
  const doc = await io.read(boucherImages(join(dossierCheveux, `${nom}.gltf`)));
  preparer(doc, dossierCheveux, 1024, false);
  rapport.push(await ecrire(doc, `cheveux_${nom.replace('Hair_', '').toLowerCase()}.glb`));
}
console.log(rapport.join('\n'));
