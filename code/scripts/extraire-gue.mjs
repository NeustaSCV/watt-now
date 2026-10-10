// Tire du modèle du gué (client/src/batiments/halte-gue/modele.js, copié de batiment/ par `npm run batiments:importer`)
// les données dont le jeu a besoin côté serveur, où le modèle (three.js, dessins au canvas) ne se charge pas : les
// segments infranchissables de ses quatre tronçons, ceux du radeau, les points de la fiche (fouille, Éteints, entrées,
// interactions), les couches qui s'effacent et les lumières. Le résultat est `commun/src/gue-modele.ts`, dans le repère
// de la fiche du modèle (FICHE, halte entière, origine au centre, le terrain à l'ouest) : `commun/src/gue.ts` le
// retourne pour suivre la carte.
//
// Le jeu dessine le gué retourné par le modèle lui-même (`creer({ miroir: true })`, FICHE_MIROIR) : les obstacles, les
// couches et les lumières sont donc tirés des tronçons retournés, puis ramenés au repère de FICHE (x → −x), pour que le
// serveur bute exactement sur ce que l'écran dessine.
//
// À relancer après chaque import d'un nouveau modèle du gué : `node scripts/extraire-gue.mjs` (depuis code/). Le test
// `serveur/src/gue.test.ts` vérifie que le fichier tiré est à jour.

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const code = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Le modèle dessine ses textures au canvas : en dehors du navigateur, un canvas muet suffit (on ne garde que les données). */
export function canvasMuet() {
  if (globalThis.document) return;
  const contexte = new Proxy(
    {},
    {
      get: (_, k) =>
        k === "createRadialGradient" || k === "createLinearGradient" || k === "createPattern"
          ? () => ({ addColorStop() {} })
          : k === "measureText"
            ? () => ({ width: 10 })
            : () => {},
      set: () => true,
    },
  );
  globalThis.document = { createElement: () => ({ width: 0, height: 0, style: {}, getContext: () => contexte }) };
}

const arr = (v) => Math.round(v * 100) / 100;

/** Les données de jeu du modèle, dans le repère de la halte entière. */
export async function extraire() {
  canvasMuet();
  const { creer, FICHE, FICHE_MIROIR } = await import("../client/src/batiments/halte-gue/modele.js");
  const segments = [];
  const vus = new Set();
  const couches = [];
  const lumieres = [];
  let radeau = null;
  // x d'un tronçon retourné → x de FICHE.
  for (const carte of FICHE_MIROIR.cartes) {
    const x0 = carte.decalage.x;
    const versFiche = (x) => arr(-(x + x0));
    const g = creer({ carte: carte.id, miroir: true });
    for (const s of g.userData.obstacles) {
      const seg = { x1: versFiche(s.x2), z1: s.z2, x2: versFiche(s.x1), z2: s.z1, nature: s.nature };
      const cle = JSON.stringify(seg);
      if (vus.has(cle)) continue;
      vus.add(cle);
      segments.push(seg);
    }
    for (const t of g.userData.toits) couches.push({ nom: t.nom, troncon: carte.id, boite: { ...t.boite, x: versFiche(t.boite.x) }, bas: t.bas, haut: t.haut });
    for (const l of g.userData.lumieres) lumieres.push({ troncon: carte.id, x: versFiche(l.x), y: l.y, z: l.z, couleur: l.couleur, intensite: l.intensite, portee: l.portee, nature: l.nature });
    // Les obstacles du radeau sont relatifs à son centre : seulement x → −x.
    const relatif = (l) => (l ?? []).map((s) => ({ x1: arr(-s.x2), z1: s.z2, x2: arr(-s.x1), z2: s.z1, nature: s.nature }));
    if (g.userData.radeau) radeau = { obstacles: relatif(g.userData.radeau.userData.obstacles), obstaclesTraversee: relatif(g.userData.radeau.userData.obstaclesTraversee) };
  }
  const points = (cle) => FICHE.cartes.flatMap((c) => c[cle].map((p) => ({ ...p, x: arr(p.x + c.decalage.x) })));
  return {
    segments,
    radeau: { ...FICHE.bac, obstacles: radeau?.obstacles ?? [], obstaclesTraversee: radeau?.obstaclesTraversee ?? [] },
    nappeRadier: FICHE.nappeRadier,
    entrees: points("entrees"),
    fouille: points("fouille"),
    eteints: points("eteints"),
    interactions: FICHE.interactions,
    panneaux: FICHE.panneaux,
    couches,
    lumieres,
  };
}

/** Le fichier TypeScript tiré du modèle. */
export function ecrire(d) {
  const ligne = (o) => `  ${JSON.stringify(o)},`;
  const liste = (nom, type, l) => `export const ${nom}: readonly ${type}[] = [\n${l.map(ligne).join("\n")}\n];\n`;
  return `// Tiré du modèle du gué par scripts/extraire-gue.mjs : ne pas modifier à la main (relancer le script après un import).
// Repère du modèle : la halte entière, 200 × 70 m, origine au centre, +x à l'est, +z au sud. commun/src/gue.ts le
// retourne (le terrain est à l'est sur la carte, à l'ouest dans le modèle).

/* eslint-disable */

/** Un segment infranchissable du modèle (murs, berges, talus, bords du radier…). */
export interface SegmentModele {
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  nature: string;
}

/** Un point de la fiche du modèle. */
export interface PointModele {
  x: number;
  z: number;
  y?: number;
  nature?: string;
  quoi?: string;
  type?: string;
  texte?: string;
}

export interface CoucheModele {
  nom: string;
  troncon: string;
  boite: { x: number; z: number; l: number; p: number };
  bas: number;
  haut: number;
}

export interface LumiereModele {
  troncon: string;
  x: number;
  y: number;
  z: number;
  couleur: number;
  intensite: number;
  portee: number;
  nature: string;
}

${liste("SEGMENTS_MODELE", "SegmentModele", d.segments)}
/** Le bac (FICHE.bac) ; ses obstacles sont relatifs au centre du radeau (les garde-corps, toujours ; les chaînes des deux bouts, pendant la traversée). */
export const BAC_MODELE = ${JSON.stringify(d.radeau, null, 2)} as const;

/** La nappe du radier (FICHE.nappeRadier) : la crue monte sa position.y. */
export const NAPPE_MODELE = ${JSON.stringify(d.nappeRadier)} as const;

${liste("ENTREES_MODELE", "PointModele", d.entrees)}
${liste("FOUILLE_MODELE", "PointModele", d.fouille)}
${liste("ETEINTS_MODELE", "PointModele", d.eteints)}
${liste("INTERACTIONS_MODELE", "PointModele", d.interactions)}
${liste("PANNEAUX_MODELE", "PointModele", d.panneaux)}
${liste("COUCHES_MODELE", "CoucheModele", d.couches)}
${liste("LUMIERES_MODELE", "LumiereModele", d.lumieres)}`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const cible = join(code, "commun", "src", "gue-modele.ts");
  const d = await extraire();
  writeFileSync(cible, ecrire(d));
  console.log(`Écrit : ${cible} (${d.segments.length} segments, ${d.fouille.length} points de fouille, ${d.eteints.length} Éteints, ${d.lumieres.length} lumières)`);
}
