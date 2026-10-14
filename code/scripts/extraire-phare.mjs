// Tire du modèle du phare (client/src/batiments/phare/modele.js, copié de batiment/ par `npm run batiments:importer`) les
// données dont le jeu a besoin côté serveur, où le modèle (three.js, dessins au canvas) ne se charge pas : ses segments
// infranchissables, ceux de l'épave (qui n'existent qu'après l'échouage), les couches qui s'effacent, les lumières, et
// ce que dit sa fiche (pièces, portes, entrées, fouilles, Éteints, l'escabeau, la rampe). Le résultat est
// `commun/src/phare-modele.ts`, dans le repère du modèle (origine au centre du lot de 60 × 50 m, +x à l'est, +z au sud) :
// `commun/src/phare.ts` le ramène dans celui du jeu.
//
// La hauteur du sol (`hauteurSol`) n'est pas tirée : le client l'importe telle quelle du modèle (le serveur reste en 2D).
//
// À relancer après chaque import d'un nouveau modèle du phare : `node scripts/extraire-phare.mjs` (depuis code/). Le test
// `serveur/src/phare.test.ts` vérifie que le fichier tiré est à jour.

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { canvasMuet } from "./extraire-gue.mjs";

const code = join(dirname(fileURLToPath(import.meta.url)), "..");

const arr = (v) => Math.round(v * 100) / 100;
const segment = (s) => ({ x1: arr(s.x1), z1: arr(s.z1), x2: arr(s.x2), z2: arr(s.z2), nature: s.nature });
const boite = (b) => ({ x: arr(b.x), z: arr(b.z), l: arr(b.l), p: arr(b.p) });
const point = (p) => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, typeof v === "number" ? arr(v) : v]));

/** Les données de jeu du modèle, dans son repère. */
export async function extraire() {
  canvasMuet();
  const { creer, FICHE } = await import("../client/src/batiments/phare/modele.js");
  const THREE = await import("three");
  const g = creer({ usure: 0.7 });
  g.updateMatrixWorld(true);
  const u = g.userData;
  // Où sont les objets nommés : le centre de leur boîte, et le bas (on les montre, on les cache, on les déplace).
  const places = {};
  for (const [id, o] of Object.entries(u.objets)) {
    if (!o) continue;
    const b = new THREE.Box3().setFromObject(o);
    const c = b.getCenter(new THREE.Vector3());
    places[id] = { x: arr(c.x), z: arr(c.z), y: arr(b.min.y) };
  }
  return {
    lot: FICHE.lot,
    depart: FICHE.depart,
    segments: u.obstacles.map(segment),
    segmentsEpave: u.obstaclesEpave.map(segment),
    couches: u.toits.map((t) => ({ nom: t.nom, boite: boite(t.boite), bas: arr(t.bas), haut: arr(t.haut), ...(t.horsDe ? { horsDe: boite(t.horsDe) } : {}) })),
    lumieres: u.lumieres.map((l) => ({ x: arr(l.x), y: arr(l.y), z: arr(l.z), couleur: l.couleur, intensite: l.intensite, portee: l.portee, nature: l.nature })),
    entrees: FICHE.entrees.map(point),
    escabeau: FICHE.escabeau,
    sensUnique: FICHE.sensUnique,
    pieces: Object.fromEntries(Object.entries(FICHE.pieces).map(([id, p]) => [id, { nom: p.nom, sombre: p.sombre, ...(p.apresEpave ? { apresEpave: true } : {}), boites: p.boites.map(boite) }])),
    portes: FICHE.portes.map(point),
    objets: Object.keys(FICHE.objets),
    places,
    epave: { echelle: FICHE.epave.echelle, cloche: FICHE.epave.cloche },
    // Les points de fouille, sans leur description (elle n'est pas un texte du jeu : les textes sont dans ressources-phare.ts).
    fouille: FICHE.fouille.map(({ quoi: _quoi, ...p }) => point(p)),
    eteints: FICHE.eteints.map(point),
  };
}

/** Le fichier TypeScript tiré du modèle. */
export function ecrire(d) {
  const ligne = (o) => `  ${JSON.stringify(o)},`;
  const liste = (nom, type, l) => `export const ${nom}: readonly ${type}[] = [\n${l.map(ligne).join("\n")}\n];\n`;
  const valeur = (nom, v, type = "") => `export const ${nom}${type} = ${JSON.stringify(v, null, 2)} as const;\n`;
  return `// Tiré du modèle du phare par scripts/extraire-phare.mjs : ne pas modifier à la main (relancer le script après un import).
// Repère du modèle : le lot de 60 × 50 m, origine au centre, +x à l'est, +z au sud (la mer). commun/src/phare.ts le ramène
// dans le repère du jeu.

/* eslint-disable */

/** Un segment infranchissable du modèle (murs, falaise, bord de l'eau, coque de l'épave…). */
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
  apresEpave?: boolean;
}

/** Une boîte centrée (l en x, p en z). */
export interface BoiteModele {
  x: number;
  z: number;
  l: number;
  p: number;
}

/** Une couche qui s'efface quand elle cache le personnage (les toits, le fût de la tour, la coque de l'épave). */
export interface CoucheModele {
  nom: string;
  boite: BoiteModele;
  bas: number;
  haut: number;
  horsDe?: BoiteModele;
}

export interface LumiereModele {
  x: number;
  y: number;
  z: number;
  couleur: number;
  intensite: number;
  portee: number;
  nature: string;
}

/** Une porte de la fiche (T6) ; \`axe\` : le sens du mur qui la porte. */
export interface PorteModele {
  id: string;
  x: number;
  z: number;
  y?: number;
  largeur: number;
  axe: string;
  entre: readonly string[];
  apresEpave?: boolean;
}

/** Une pièce de la fiche (T6). */
export interface PieceModele {
  nom: string;
  sombre: boolean;
  apresEpave?: boolean;
  boites: readonly BoiteModele[];
}

${valeur("LOT_MODELE", d.lot)}
${valeur("DEPART_MODELE", d.depart)}
${liste("SEGMENTS_MODELE", "SegmentModele", d.segments)}
/** Les segments de l'épave (\`obstaclesEpave\`) : ils n'existent qu'après l'échouage. */
${liste("SEGMENTS_EPAVE", "SegmentModele", d.segmentsEpave)}
${liste("COUCHES_MODELE", "CoucheModele", d.couches)}
${liste("LUMIERES_MODELE", "LumiereModele", d.lumieres)}
${liste("ENTREES_MODELE", "PointModele", d.entrees)}
/** La marque à la craie où poser l'escabeau, sous la première marche de l'escalier coupé (P4). */
${valeur("ESCABEAU_MODELE", d.escabeau)}
/** Le passage à sens unique de la rampe du canot (P8). */
${valeur("SENS_UNIQUE_MODELE", d.sensUnique)}
export const PIECES_MODELE: Readonly<Record<string, PieceModele>> = ${JSON.stringify(d.pieces, null, 2)};

${liste("PORTES_MODELE", "PorteModele", d.portes)}
/** Les objets nommés du modèle (FICHE.objets). */
export const OBJETS_MODELE = ${JSON.stringify(d.objets)} as const;

/** Où sont les objets nommés (le centre de leur boîte ; y : leur bas). */
export const PLACES_OBJETS: Readonly<Record<(typeof OBJETS_MODELE)[number], { x: number; z: number; y: number }>> = ${JSON.stringify(d.places, null, 2)};

/** L'échelle de coupée et la cloche de l'épave. */
${valeur("EPAVE_MODELE", d.epave)}
${liste("FOUILLE_MODELE", "PointModele", d.fouille)}
${liste("ETEINTS_MODELE", "PointModele", d.eteints)}`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const cible = join(code, "commun", "src", "phare-modele.ts");
  const d = await extraire();
  writeFileSync(cible, ecrire(d));
  console.log(`Écrit : ${cible} (${d.segments.length} segments, ${d.segmentsEpave.length} de l'épave, ${d.fouille.length} points de fouille, ${d.eteints.length} Éteints)`);
}
