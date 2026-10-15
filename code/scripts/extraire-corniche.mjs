// Tire du modèle de la corniche (client/src/batiments/halte-corniche/modele.js, copié de batiment/ par
// `npm run batiments:importer`) les données dont le jeu a besoin côté serveur, où le modèle (three.js, dessins au canvas)
// ne se charge pas : les segments infranchissables de ses quatre tronçons, ceux qui n'existent que dans un état (la
// porte fermée de la barricade du tunnel, le pin tombé), les points de la fiche (fouille, Éteints, entrées), ses pièces
// et ses portes, et ses lumières. Le résultat est `commun/src/corniche-modele.ts`, dans le repère de la fiche du modèle
// (FICHE, halte entière, origine au centre, +x à l'est vers le phare) : `commun/src/corniche.ts` le pose dans le repère
// du jeu (sans le retourner : le terrain est à l'ouest sur la carte comme dans le modèle).
//
// À relancer après chaque import d'un nouveau modèle de la corniche : `node scripts/extraire-corniche.mjs` (depuis
// code/). Le test `serveur/src/corniche.test.ts` vérifie que le fichier tiré est à jour.

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { canvasMuet } from "./extraire-gue.mjs";

const code = join(dirname(fileURLToPath(import.meta.url)), "..");

const arr = (v) => Math.round(v * 100) / 100;

/** Les données de jeu du modèle, dans le repère de la halte entière. */
export async function extraire() {
  canvasMuet();
  const { creer, FICHE } = await import("../client/src/batiments/halte-corniche/modele.js");
  const segments = [];
  const pin = [];
  const barricade = [];
  const lumieres = [];
  const vus = new Set();
  // x d'un tronçon (recentré) → x de FICHE.
  for (const carte of FICHE.cartes) {
    const x0 = carte.decalage.x;
    const versFiche = (s) => ({ x1: arr(s.x1 + x0), z1: arr(s.z1), x2: arr(s.x2 + x0), z2: arr(s.z2), nature: s.nature });
    const g = creer({ carte: carte.id });
    for (const s of g.userData.obstacles) {
      const seg = versFiche(s);
      const cle = JSON.stringify(seg);
      if (vus.has(cle)) continue;
      vus.add(cle);
      segments.push(seg);
    }
    pin.push(...g.userData.obstaclesPin.map(versFiche));
    barricade.push(...g.userData.obstaclesBarricade.map(versFiche));
    for (const l of g.userData.lumieres) lumieres.push({ troncon: carte.id, x: arr(l.x + x0), y: l.y, z: arr(l.z), couleur: l.couleur, intensite: l.intensite, portee: l.portee, nature: l.nature });
  }
  const points = (cle) => FICHE.cartes.flatMap((c) => c[cle].map((p) => ({ ...p, x: arr(p.x + c.decalage.x) })));
  const pieces = {};
  for (const c of FICHE.cartes) for (const [id, p] of Object.entries(c.pieces)) pieces[id] = { ...p, boites: p.boites.map((b) => ({ ...b, x: arr(b.x + c.decalage.x) })) };
  return {
    segments,
    pin,
    barricade,
    entrees: points("entrees"),
    // De chaque fouille, son endroit seulement (« chambre 1 », « vrac de pierres ») : le détail du décor reste au modèle
    // (il nomme des objets que le jeu ne donne pas, et des mots que ses textes évitent).
    fouille: points("fouille").map((f) => ({ ...f, quoi: f.quoi.split(" : ")[0] })),
    eteints: points("eteints"),
    portes: points("portes"),
    pieces,
    goulets: FICHE.goulets,
    // Les panneaux (0.10, R52 : ceux des deux sorties disent laquelle ; leur lanterne est dans les lumières).
    panneaux: FICHE.panneaux,
    lumieres,
  };
}

/** Le fichier TypeScript tiré du modèle. */
export function ecrire(d) {
  const ligne = (o) => `  ${JSON.stringify(o)},`;
  const liste = (nom, type, l) => `export const ${nom}: readonly ${type}[] = [\n${l.map(ligne).join("\n")}\n];\n`;
  return `// Tiré du modèle de la corniche par scripts/extraire-corniche.mjs : ne pas modifier à la main (relancer le script après
// un import). Repère du modèle : la halte entière, 200 × 70 m, origine au centre, +x à l'est (le phare), +z au sud (la
// mer). commun/src/corniche.ts le pose dans le repère du jeu.

/* eslint-disable */

import type { LumiereModele, PointModele, SegmentModele } from "./gue-modele.ts";

/** Une pièce du modèle (la vue par pièce) : ses boîtes centrées, l en x, p en z. */
export interface PieceModele {
  nom: string;
  sombre: boolean;
  boites: readonly { x: number; z: number; l: number; p: number }[];
}

/** Une porte du modèle : sa largeur entre les morceaux d'obstacle, l'axe du mur qui la porte, les deux pièces. */
export interface PorteModele {
  id: string;
  x: number;
  z: number;
  largeur: number;
  axe: "x" | "z";
  entre: readonly [string, string];
}

${liste("SEGMENTS_CORNICHE", "SegmentModele", d.segments)}
/** Le pin d'Alep tombé, entier (\`obstaclesPin\`). */
${liste("OBSTACLES_PIN", "SegmentModele", d.pin)}
/** La porte fermée de la barricade du tunnel (\`obstaclesBarricade\`) : on la retire quand le passage est payé. */
${liste("OBSTACLES_BARRICADE", "SegmentModele", d.barricade)}
${liste("ENTREES_CORNICHE", "PointModele", d.entrees)}
${liste("FOUILLE_CORNICHE", "PointModele", d.fouille)}
${liste("ETEINTS_CORNICHE", "PointModele", d.eteints)}
${liste("PORTES_CORNICHE", "PorteModele", d.portes)}
export const PIECES_CORNICHE: Readonly<Record<string, PieceModele>> = ${JSON.stringify(d.pieces, null, 2)};

${liste("GOULETS_CORNICHE", "PointModele", d.goulets)}
/** Les panneaux de la fiche ; ceux des sorties (0.10, R52) disent laquelle. */
${liste("PANNEAUX_CORNICHE", "(PointModele & { sortie?: string })", d.panneaux)}
${liste("LUMIERES_CORNICHE", "LumiereModele", d.lumieres)}`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const cible = join(code, "commun", "src", "corniche-modele.ts");
  const d = await extraire();
  writeFileSync(cible, ecrire(d));
  console.log(`Écrit : ${cible} (${d.segments.length} segments, ${d.fouille.length} points de fouille, ${d.eteints.length} Éteints, ${d.lumieres.length} lumières)`);
}
