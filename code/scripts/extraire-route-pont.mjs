// Tire du modèle de la route du pont (client/src/batiments/halte-route-pont/modele.js, copié de batiment/ par
// `npm run batiments:importer`) les données dont le jeu a besoin côté serveur, où le modèle (three.js, dessins au
// canvas) ne se charge pas : les segments infranchissables de ses quatre tronçons, ceux qui ne valent qu'à un état (la
// porte du péage fermée ou ouverte, l'accès de la cale fermé par la marée haute), les points de la fiche (entrées,
// fouille, Éteints, panneaux, goulets, la marée), les couches qui s'effacent et les lumières. Le résultat est
// `commun/src/route-pont-modele.ts`, dans le repère de la fiche du modèle (FICHE, halte entière, origine au centre) :
// `commun/src/route-pont.ts` le pose dans le repère du jeu (plan 0.10, chantier H).
//
// À relancer après chaque import d'un nouveau modèle : `node scripts/extraire-route-pont.mjs` (depuis code/). Le test
// `serveur/src/route-pont.test.ts` vérifie que le fichier tiré est à jour.

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { canvasMuet } from "./extraire-gue.mjs";

const code = join(dirname(fileURLToPath(import.meta.url)), "..");

const arr = (v) => Math.round(v * 100) / 100;

/** Les données de jeu du modèle, dans le repère de la halte entière. */
export async function extraire() {
  canvasMuet();
  const { creer, FICHE } = await import("../client/src/batiments/halte-route-pont/modele.js");
  const segments = [];
  const vus = new Set();
  const couches = [];
  const lumieres = [];
  const etats = { chicaneFermee: [], chicaneOuverte: [], mareeHaute: [] };
  for (const carte of FICHE.cartes) {
    const x0 = carte.decalage.x;
    // Chaque tronçon est recentré sur son lot : on le remet dans le repère de la halte.
    const seg = (s) => ({ x1: arr(s.x1 + x0), z1: s.z1, x2: arr(s.x2 + x0), z2: s.z2, nature: s.nature });
    const g = creer({ carte: carte.id });
    for (const s of g.userData.obstacles) {
      const h = seg(s);
      const cle = JSON.stringify(h);
      if (vus.has(cle)) continue;
      vus.add(cle);
      segments.push(h);
    }
    const objets = g.userData.objets;
    if (objets.chicane_fermee) etats.chicaneFermee.push(...objets.chicane_fermee.userData.obstacles.map(seg));
    if (objets.chicane_ouverte) etats.chicaneOuverte.push(...objets.chicane_ouverte.userData.obstacles.map(seg));
    etats.mareeHaute.push(...g.userData.obstaclesMareeHaute.map(seg));
    for (const t of g.userData.toits) couches.push({ nom: t.nom, troncon: carte.id, boite: { ...t.boite, x: arr(t.boite.x + x0) }, bas: t.bas, haut: t.haut });
    for (const l of g.userData.lumieres) lumieres.push({ troncon: carte.id, x: arr(l.x + x0), y: l.y, z: l.z, couleur: l.couleur, intensite: l.intensite, portee: l.portee, nature: l.nature });
  }
  const points = (cle) => FICHE.cartes.flatMap((c) => c[cle].map((p) => ({ ...p, x: arr(p.x + c.decalage.x) })));
  return {
    segments,
    etats,
    entrees: points("entrees"),
    fouille: points("fouille"),
    eteints: points("eteints"),
    panneaux: FICHE.panneaux,
    goulets: FICHE.goulets,
    maree: FICHE.maree,
    couches,
    lumieres,
  };
}

/** Le fichier TypeScript tiré du modèle. */
export function ecrire(d) {
  const ligne = (o) => `  ${JSON.stringify(o)},`;
  const liste = (nom, type, l) => `export const ${nom}: readonly ${type}[] = [\n${l.map(ligne).join("\n")}\n];\n`;
  return `// Tiré du modèle de la route du pont par scripts/extraire-route-pont.mjs : ne pas modifier à la main (relancer le
// script après un import). Repère du modèle : la halte entière, 200 × 70 m, origine au centre, +x à l'est, +z au sud.
// commun/src/route-pont.ts le pose dans le repère du jeu.

/* eslint-disable */

import type { CoucheModele, LumiereModele, PointModele, SegmentModele } from "./gue-modele.ts";

/** Un point de la fiche qui ne vaut qu'à marée basse (les bancs de la cale, ses Noyés). */
export interface PointMaree extends PointModele {
  maree?: string;
}

${liste("SEGMENTS_PONT", "SegmentModele", d.segments)}
/** La porte du péage fermée (obstaclesChicane du modèle). */
${liste("CHICANE_FERMEE_PONT", "SegmentModele", d.etats.chicaneFermee)}
/** La porte du péage ouverte, rabattue contre les sacs. */
${liste("CHICANE_OUVERTE_PONT", "SegmentModele", d.etats.chicaneOuverte)}
/** L'accès de la cale basse, fermé par la marée haute (obstaclesMareeHaute du modèle). */
${liste("MAREE_HAUTE_PONT", "SegmentModele", d.etats.mareeHaute)}
${liste("ENTREES_PONT", "PointModele", d.entrees)}
${liste("FOUILLE_PONT", "PointMaree", d.fouille)}
${liste("ETEINTS_PONT", "PointMaree", d.eteints)}
${liste("PANNEAUX_PONT", "PointModele", d.panneaux)}
${liste("GOULETS_PONT", "PointModele", d.goulets)}
/** La marée (FICHE.maree) : les hauteurs d'eau, l'échelle, la cale basse et le point de retour. */
export const MAREE_PONT = ${JSON.stringify(d.maree, null, 2)} as const;

${liste("COUCHES_PONT", "CoucheModele", d.couches)}
${liste("LUMIERES_PONT", "LumiereModele", d.lumieres)}`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const cible = join(code, "commun", "src", "route-pont-modele.ts");
  const d = await extraire();
  writeFileSync(cible, ecrire(d));
  console.log(`Écrit : ${cible} (${d.segments.length} segments, ${d.fouille.length} points de fouille, ${d.eteints.length} Éteints, ${d.lumieres.length} lumières)`);
}
