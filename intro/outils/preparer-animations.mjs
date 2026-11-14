#!/usr/bin/env node
/* Watt Now? — intro : les animations que le jeu n'utilise pas encore, tirées des mêmes packs CC0 de Quaternius
   (download/, lus sans les modifier). Même traitement que le jeu (rotations seules, plus la position du bassin),
   pour qu'elles s'appliquent aux corps du jeu. Écrit intro/assets/personnages/animations_intro.glb.

   node intro/outils/preparer-animations.mjs */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const ICI = join(dirname(fileURLToPath(import.meta.url)), '..');
const RACINE = join(ICI, '..');
const exiger = createRequire(join(RACINE, 'code', 'package.json'));
const charger = async (nom) => import(pathToFileURL(exiger.resolve(nom)).href);
const { NodeIO } = await charger('@gltf-transform/core');
const { ALL_EXTENSIONS } = await charger('@gltf-transform/extensions');
const { dedup, meshopt, prune, quantize, resample } = await charger('@gltf-transform/functions');
const { MeshoptEncoder } = await charger('meshoptimizer');

const GARDER = [
  'Idle_TalkingPhone_Loop', 'Farm_PlantSeed', 'Farm_Watering', 'ClimbUp_1m', 'Sitting_Talking_Loop', 'Sitting_Enter',
  'Idle_Rail_Loop', 'Idle_Rail_Call', 'Yes', 'Idle_No_Loop', 'Push_Loop', 'Spell_Simple_Idle_Loop', 'Spell_Simple_Enter',
  'Spell_Simple_Shoot', 'Walk_Formal_Loop', 'OverhandThrow', 'Sword_Idle', 'Sword_Regular_B', 'Sword_Regular_C', 'Melee_Hook_Rec',
];
const travail = join(ICI, '.travail', 'animations');
mkdirSync(travail, { recursive: true });
const sources = [];
for (const [zip, fichier] of [['Universal Animation Library[Standard].zip', 'UAL1_Standard.glb'], ['Universal Animation Library 2[Standard].zip', 'UAL2_Standard.glb']]) {
  const dossier = join(travail, fichier.replace('.glb', ''));
  if (!existsSync(dossier)) { mkdirSync(dossier, { recursive: true }); execFileSync('unzip', ['-q', '-o', join(RACINE, 'download', zip), '-d', dossier]); }
  const trouve = readdirSync(dossier, { recursive: true }).map(String).find((f) => basename(f) === fichier);
  sources.push(join(dossier, trouve));
}
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const docs = [];
for (const f of sources) {
  const doc = await io.read(f);
  const root = doc.getRoot();
  for (const a of root.listAnimations()) {
    if (!GARDER.includes(a.getName())) { a.dispose(); continue; }
    for (const c of a.listChannels()) {
      const os = c.getTargetNode()?.getName();
      if (c.getTargetPath() === 'scale' || (c.getTargetPath() === 'translation' && os !== 'pelvis')) { c.getSampler()?.dispose(); c.dispose(); }
    }
  }
  for (const n of root.listNodes()) if (n.getMesh()) n.getMesh().dispose(), n.setMesh(null).setSkin(null);
  for (const s of root.listSkins()) s.dispose();
  await doc.transform(resample({ tolerance: 1e-4 }), prune(), dedup(), quantize(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  docs.push([doc, root.listAnimations().map((a) => a.getName())]);
}
// deux fichiers (un par pack : les squelettes sont identiques, mais on évite de fusionner deux scènes)
const sortie = join(ICI, 'assets', 'personnages');
for (const [i, [doc, noms]] of docs.entries()) {
  const chemin = join(sortie, `animations_intro_${i + 1}.glb`);
  await io.write(chemin, doc);
  console.log(`${basename(chemin)} : ${(statSync(chemin).size / 1024).toFixed(0)} Ko — ${noms.join(', ')}`);
}
