// Plan 0.9, chantier H (M6, §3.3 quater) : l'entrée de la cabane du passeur, au gué.
//
// Le constat du porteur : « le canoë retourné devant le bac empêche d'entrer dans la maison (pourtant un zombie arrive à
// sortir) ». Au calcul (repère du jeu, gué retourné), trois fentes, toutes du modèle :
//   - entre la barque retournée et le coin de la cabane : 0,74 m ;
//   - entre la barque et le poteau du bac : 0,78 m ;
//   - la porte elle-même : 0,81 m entre les deux morceaux du mur est (la porte de la buvette aussi : 0,80 m).
// Le joueur (rayon 0,35 m, deplacement.ts) a besoin de 0,70 m ; l'Éteint (rayon 0,30 m, eteints.ts) de 0,60 m. Les deux
// butent sur la même zone (ZONE_GUE, zoneGue) : l'Éteint ne passe pas par un trou, il est seulement plus mince. Il se
// glisse dans des fentes de 8 à 20 cm de jeu où le joueur n'a que 0 à 10 cm, au millimètre près. Le joueur, lui, ne
// rejoint le porche qu'en faisant le tour (par la cale du bac, ou par derrière la cabane), et la porte reste un chas
// d'aiguille.
//
// Le choix du porteur (2026-10-14) : la barque déplacée d'un mètre environ, sans bloquer l'accès au bac. Le dernier test
// le garde, dès aujourd'hui et après l'import.
//
// Le modèle retouché par la session « bâtiments » (reponse-batiment-gue.md, 2026-10-14) est importé : les trois tests
// passent.

import { test } from "node:test";
import assert from "node:assert/strict";
import { BAC, auGue } from "../../commun/src/gue.ts";
import { ZONE_GUE, heurte, type Zone } from "../../commun/src/lieux.ts";

/** Le pas de la grille des chemins, en mètres. */
const PAS = 0.05;
/** Le joueur « à l'aise » : son rayon (0,35 m) et 10 cm de jeu de chaque côté, soit un passage de 0,9 m. */
const RAYON_A_L_AISE = 0.45;
/** Le rayon des Éteints (eteints.ts, deplacer). */
const RAYON_ETEINT = 0.3;

/**
 * La cour de la cabane (repère du modèle, non retourné) : de l'ouest de la cabane (on en fait le tour par derrière)
 * jusqu'au poteau du bac, sans la cale (on n'y passe pas pour entrer chez le passeur), du talus au nord jusqu'au chemin
 * au sud.
 */
const COUR = (() => {
  const a = auGue(-30, -32);
  const b = auGue(-15.6, -21);
  return { x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x), z0: Math.min(a.z, b.z), z1: Math.max(a.z, b.z) };
})();
/** Devant la cabane, côté chemin, là où erre l'Éteint « entre la cabane et le bac ». */
const DEVANT = auGue(-18.6, -21.6);
/** Au milieu de la cabane. */
const DEDANS = auGue(-24, -27.2);

/** Les abords du bac, côté cabane (repère du modèle) : la cour, la cale et le chemin jusqu'au sud de la borne. */
const ABORDS_DU_BAC = (() => {
  const a = auGue(-30, -32);
  const b = auGue(-9, -17);
  return { x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x), z0: Math.min(a.z, b.z), z1: Math.max(a.z, b.z) };
})();

type Cadre = typeof COUR;

const cle = (i: number, j: number) => `${i},${j}`;
const caseDe = (p: { x: number; z: number }) => cle(Math.round(p.x / PAS), Math.round(p.z / PAS));

/**
 * La longueur du plus court chemin (pas de 5 cm, en croix) depuis `depart` jusqu'à chaque case qu'atteint, sans sortir
 * du cadre (la cour, par défaut), un corps de ce rayon.
 */
function chemins(zone: Zone, depart: { x: number; z: number }, rayon: number, cadre: Cadre = COUR): Map<string, number> {
  const longueurs = new Map<string, number>();
  const i0 = Math.round(depart.x / PAS);
  const j0 = Math.round(depart.z / PAS);
  if (heurte(zone, i0 * PAS, j0 * PAS, rayon)) return longueurs;
  longueurs.set(cle(i0, j0), 0);
  let front: [number, number][] = [[i0, j0]];
  for (let n = 1; front.length > 0; n++) {
    const suivant: [number, number][] = [];
    for (const [i, j] of front) {
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const ni = i + di;
        const nj = j + dj;
        const k = cle(ni, nj);
        if (longueurs.has(k)) continue;
        const x = ni * PAS;
        const z = nj * PAS;
        if (x < cadre.x0 || x > cadre.x1 || z < cadre.z0 || z > cadre.z1 || heurte(zone, x, z, rayon)) continue;
        longueurs.set(k, n * PAS);
        suivant.push([ni, nj]);
      }
    }
    front = suivant;
  }
  return longueurs;
}

test(
  "cabane du passeur : depuis le chemin, un joueur entre par la porte, à l'aise (un passage de 0,9 m) et sans détour",
  () => {
    assert.ok(!heurte(ZONE_GUE, DEVANT.x, DEVANT.z, RAYON_A_L_AISE), "le point de départ, devant la cabane, est libre");
    const longueur = chemins(ZONE_GUE, DEVANT, RAYON_A_L_AISE).get(caseDe(DEDANS));
    assert.ok(longueur !== undefined, "le joueur atteint l'intérieur de la cabane");
    // Avant la retouche (0.8.4), il fallait faire le tour par derrière la cabane : 31 m au lieu de 11.
    const enCroix = Math.abs(DEDANS.x - DEVANT.x) + Math.abs(DEDANS.z - DEVANT.z);
    assert.ok(longueur <= 1.3 * enCroix, `${longueur.toFixed(1)} m de chemin pour ${enCroix.toFixed(1)} m en croix : un détour`);
  },
);

test(
  "cabane du passeur : un Éteint ne prend aucun raccourci que le joueur n'a pas (mêmes obstacles, pas de fente)",
  () => {
    const joueur = chemins(ZONE_GUE, DEVANT, RAYON_A_L_AISE);
    const eteint = chemins(ZONE_GUE, DEVANT, RAYON_ETEINT);
    // Partout où le joueur tient à l'aise, l'Éteint n'arrive pas par un chemin bien plus court (ni par un chemin que le
    // joueur n'a pas) : les contours, un peu plus serrés pour le plus mince, font la marge.
    const raccourcis: string[] = [];
    for (const [k, l] of eteint) {
      const [i, j] = k.split(",").map(Number) as [number, number];
      if (heurte(ZONE_GUE, i * PAS, j * PAS, RAYON_A_L_AISE)) continue;
      if ((joueur.get(k) ?? Infinity) > 1.2 * l + 1) raccourcis.push(`(${(i * PAS).toFixed(2)} ; ${(j * PAS).toFixed(2)})`);
    }
    assert.equal(raccourcis.length, 0, `${raccourcis.length} cases où l'Éteint arrive par un raccourci, par exemple ${raccourcis[0]}`);
  },
);

test("cabane du passeur : depuis le chemin, on rejoint à l'aise et sans détour le point d'embarquement du bac, à la cale", () => {
  const embarquement = BAC.cale.embarquement;
  assert.ok(!heurte(ZONE_GUE, embarquement.x, embarquement.z, RAYON_A_L_AISE), "le point d'embarquement est libre");
  // Devant la cabane, sur le chemin plus au sud, et de l'autre côté de la cabane : la barque ne doit gêner aucun d'eux.
  for (const depart of [DEVANT, auGue(-18, -18.5), auGue(-22, -19)]) {
    const longueur = chemins(ZONE_GUE, depart, RAYON_A_L_AISE, ABORDS_DU_BAC).get(caseDe(embarquement));
    assert.ok(longueur !== undefined, `depuis (${depart.x} ; ${depart.z}), on atteint l'embarquement`);
    const enCroix = Math.abs(embarquement.x - depart.x) + Math.abs(embarquement.z - depart.z);
    assert.ok(longueur <= 1.1 * enCroix, `depuis (${depart.x} ; ${depart.z}) : ${longueur.toFixed(1)} m pour ${enCroix.toFixed(1)} m en croix`);
  }
});
