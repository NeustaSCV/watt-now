// H1B, le Gué-aux-Saules (plan 0.8, chantier 11 ; étude `h1b-l1b-conception.md` §1, G1 à G16) : une halte partagée,
// comme la station. Ce fichier dit tout ce que le serveur et le client partagent :
//
// - le repère : le modèle (`batiment/halte-gue/`, copié dans client/src/batiments/) a le terrain à l'ouest ; la carte,
//   à l'est. Le gué est donc **retourné** (x du jeu = 100 − x du modèle ; z du jeu = z du modèle + 35), comme on l'a fait
//   pour la station (P-006). Les données du modèle viennent de `gue-modele.ts` (scripts/extraire-gue.mjs) ;
// - la zone : les obstacles du modèle, l'eau (la rivière n'est pas praticable, sauf le radier, le banc de galets, la
//   cale et le ponton), et ce qui bouge : le radeau du bac, le radier noyé par la crue (`zoneGue`) ;
// - le contenu : les pierres (B5), le banc de galets personnel, le gisement de glaise (B6), les joncs (B7), le tas de
//   branches, les fouilles « par chance », les 11 Éteints du modèle ;
// - les moments de jeu (G16) : le radier qui gronde (G1), l'Éteint qui dérive (G2), les balises (G3), la crue (G4), le
//   bac (G5, G6), la cloche (G7), les ricochets (G8).
//
// Ce module ne lit `lieux.ts` que pour ses types : `lieux.ts` en tire ZONE_GUE.

import { creerGrille, type GrilleObstacles } from "./grille.ts";
import type { Boite, Zone } from "./lieux.ts";
import type { Eteint } from "./eteints.ts";
import { DUREE_TRANCHE_MS, tempsDeLaTranche } from "./meteo.ts";
import { declarerObstaclesBas } from "./murs.ts";
import { VRAC_MAX, aleatoire, type ButinLieu, type RessourceSol, type TypeRessource } from "./terrain.ts";
import { percer, type FenetreVue, type PlanVue, type PorteVue } from "./vue.ts";
import { BAC_MODELE, ETEINTS_MODELE, NAPPE_MODELE, SEGMENTS_MODELE, type SegmentModele } from "./gue-modele.ts";

/** À augmenter quand le contenu du gué change : la base le régénère alors. */
export const VERSION_GUE = 2;

// ---------- Le repère : le gué retourné ----------

/** Le gué fait 200 × 70 m (quatre tronçons de 50 × 70 m). */
export const TAILLE_GUE = { longueur: 200, largeur: 70 } as const;

const arrondi = (v: number) => Math.round(v * 100) / 100;

/** Un point du modèle dans le repère du jeu (retourné : le terrain à l'est). */
export function auGue(xm: number, zm: number): { x: number; z: number } {
  return { x: arrondi(100 - xm), z: arrondi(zm + 35) };
}

/** Un point du jeu dans le repère du modèle. */
export function auModele(x: number, z: number): { x: number; z: number } {
  return { x: 100 - x, z: z - 35 };
}

// ---------- La géographie (reprise du modèle : XC, W2, RAD, BARRE, CABLE_Z) ----------

/** L'axe de la rivière (repère du modèle) : elle ondule à peine. */
export function axeRiviere(zm: number): number {
  return 2 + 1.2 * Math.sin(zm * 0.08);
}
/** Demi-largeur de la rivière, d'une crête de berge à l'autre ; la berge infranchissable est 0,2 m en dedans. */
const DEMI_RIVIERE = 11.5;

/** Le radier submersible, dans le repère du jeu (x0 < x1). */
export const RADIER = (() => {
  const a = auGue(NAPPE_MODELE.x2, NAPPE_MODELE.z1);
  const b = auGue(NAPPE_MODELE.x1, NAPPE_MODELE.z2);
  return { x0: a.x, x1: b.x, z0: a.z, z1: b.z } as const;
})();

/** Le banc de galets accroché au radier, côté aval (repère du modèle : un segment et son rayon). */
const BANC_MODELE = { a: [6, -9.2], b: [6.6, -6.0], r: 1.9 } as const;
/** Le centre du banc, dans le repère du jeu. */
export const BANC = auGue(6.3, -7.6);

/** Le bac : le câble (z), les deux accostages du radeau, ses dimensions (repère du jeu). */
export const BAC = (() => {
  const z = auGue(0, BAC_MODELE.cable.z).z;
  const [ouest, est] = BAC_MODELE.accostages;
  return {
    z,
    /** La cale de béton, côté terrain (la rive ouest du modèle) : où le radeau attend, et où l'on embarque. */
    cale: { x: auGue(ouest.x, 0).x, embarquement: auGue(ouest.embarquement.x, ouest.embarquement.z) },
    /** Le ponton de bois, côté Moulin. */
    ponton: { x: auGue(est.x, 0).x, embarquement: auGue(est.embarquement.x, est.embarquement.z) },
    demiLongueur: BAC_MODELE.radeau.longueur / 2,
    demiLargeur: BAC_MODELE.radeau.largeur / 2,
    /** Les deux poteaux du câble. */
    poteaux: [auGue(BAC_MODELE.cable.x1, BAC_MODELE.cable.z).x, auGue(BAC_MODELE.cable.x2, BAC_MODELE.cable.z).x],
  } as const;
})();

/** La cloche du passeur, à la cale (G7). */
export const CLOCHE = { ...auGue(-12.8, -22.4), portee: 40, dureeS: 3 } as const;

/** Le gisement de glaise, sur la berge de vase sous le camping-car (B6). */
export const GLAISE = auGue(16.0, 20.4);

/** Les six touffes de joncs du modèle (B7). */
const JONCS_MODELE: readonly (readonly [number, number])[] = [[-9.4, 14.5], [-9.6, 18.2], [-9.2, 21.6], [-11.6, -19.5], [14.4, -5.2], [16.2, 7.6]];

// ---------- Où l'on est ----------

/** Dans l'eau (là où l'on ne marche pas) : entre les deux berges. */
export function dansLaRiviere(x: number, z: number, marge = 0): boolean {
  const m = auModele(x, z);
  return Math.abs(m.x - axeRiviere(m.z)) < DEMI_RIVIERE - 0.2 - marge;
}

/** Sur le radier (G1) : on y marche, on n'y court pas ; l'eau couvre les pas, et l'on n'entend plus les Éteints. */
export function surLeRadier(x: number, z: number): boolean {
  return x >= RADIER.x0 && x <= RADIER.x1 && z >= RADIER.z0 && z <= RADIER.z1 && dansLaRiviere(x, z, -0.6);
}

function distSegment(x: number, z: number, a: readonly number[], b: readonly number[]): number {
  const dx = b[0]! - a[0]!;
  const dz = b[1]! - a[1]!;
  const t = Math.max(0, Math.min(1, ((x - a[0]!) * dx + (z - a[1]!) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(x - a[0]! - dx * t, z - a[1]! - dz * t);
}

/** Sur le banc de galets (repère du jeu). */
export function surLeBanc(x: number, z: number, marge = 0): boolean {
  const m = auModele(x, z);
  return distSegment(m.x, m.z, BANC_MODELE.a, BANC_MODELE.b) < BANC_MODELE.r + marge;
}

// ---------- Le radier qui gronde (G1) ----------

/** Sur le radier, le bruit de l'eau couvre les pas (la signature sonore du joueur ×0,3). */
export const SIGNATURE_RADIER = 0.3;
/** Sur le radier, on n'entend plus les Éteints au-delà de 3 m (ni sons, ni ondes). */
export const OUIE_RADIER = 3;

// ---------- La crue (G4) ----------

export type NiveauCrue = "bas" | "monte" | "noye";

/** Ce que fait l'eau : son niveau, et la montée de la nappe du radier (m, pour le rendu). */
export interface Crue {
  niveau: NiveauCrue;
  montee: number;
}

/** Le radier noyé reste noyé 6 min après la pluie (deux tranches de 3 min). */
const APRES_PLUIE = 2;
/** La nappe : à la bande blanche quand elle monte, à la rouge quand le radier est noyé (les balises du modèle). */
export const NAPPE_BLANCHE = 0.45;
export const NAPPE_ROUGE = 0.8;

/**
 * La crue (G4, décidée le 2026-10-10 : « après deux tranches de pluie de suite ») : pendant la deuxième tranche de
 * pluie, l'eau monte jusqu'à la bande blanche ; au bout de la deuxième, le radier est noyé, tant qu'il pleut et 6 min
 * après. Elle se calcule de l'heure du monde, comme la météo : le serveur et l'écran la voient pareil.
 */
export function crue(instant: number, debutMonde: number): Crue {
  const t = Math.max(0, instant - debutMonde) / DUREE_TRANCHE_MS;
  const tranche = Math.floor(t);
  const pluie = (k: number) => k >= 0 && tempsDeLaTranche(k) === "pluie";
  // La dernière tranche de pluie, ici ou dans les deux d'avant (6 min).
  let fin = -1;
  for (let k = tranche; k >= tranche - APRES_PLUIE; k--) {
    if (pluie(k)) {
      fin = k;
      break;
    }
  }
  if (fin < 0) return { niveau: "bas", montee: 0 };
  let debut = fin;
  while (debut > tranche - 200 && pluie(debut - 1)) debut--;
  const longueur = fin - debut + 1;
  if (fin === tranche) {
    const deja = tranche - debut + 1;
    if (deja >= 3) return { niveau: "noye", montee: NAPPE_ROUGE };
    if (deja === 2) return { niveau: "monte", montee: NAPPE_BLANCHE * Math.min(1, t - tranche) };
    return { niveau: "bas", montee: 0 };
  }
  return longueur >= 2 ? { niveau: "noye", montee: NAPPE_ROUGE } : { niveau: "bas", montee: 0 };
}

/** L'examen d'une balise (G3) : le niveau de l'eau, en une ligne. */
export function texteBalise(niveau: NiveauCrue): string {
  if (niveau === "noye") return "L'eau est à la bande rouge : le radier est noyé. Reste le bac, ou attendre la décrue.";
  if (niveau === "monte") return "L'eau est à la bande blanche. À la rouge, on ne passe plus.";
  return "L'eau est sous la bande blanche : on passe. À la rouge, on ne passerait plus.";
}

/** Ce que le carnet dit quand l'eau change (une ligne de message, jamais une fenêtre). */
export const LIGNES_CRUE: Record<NiveauCrue, string> = {
  monte: "La rivière monte : l'eau touche la bande blanche des balises du radier.",
  noye: "Le radier est noyé : on ne passe plus qu'avec le bac du passeur.",
  bas: "L'eau baisse : le radier se découvre.",
};

/**
 * Les balises du radier (le modèle : une tous les 2,5 m de chaque côté, sauf devant le banc ; les arrachées en moins,
 * le même tirage que le modèle à l'usure 0,7), et l'échelle de crue à la tête du radier côté terrain.
 */
export const BALISES: readonly { x: number; z: number }[] = (() => {
  const hache = (i: number, j: number) => {
    let h = (i * 374761393 + j * 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  const liste: { x: number; z: number }[] = [auGue(-11.2, NAPPE_MODELE.z1 - 0.25)];
  for (let x = NAPPE_MODELE.x1 + 0.8; x < NAPPE_MODELE.x2; x += 2.5) {
    for (const z of [NAPPE_MODELE.z1 + 0.15, NAPPE_MODELE.z2 - 0.15]) {
      if (z > NAPPE_MODELE.z1 + 1 && x > 3.6 && x < 8.6) continue;
      if (hache(Math.round(x * 3 + z), 1) < 0.18 * 0.7) continue;
      liste.push(auGue(x, z));
    }
  }
  return liste;
})();

// ---------- Le bac à câble (G5, G6) ----------

/** Le radeau glisse le long du câble : de la cale au ponton en ≈ 15 s (G5). */
export const DUREE_TRAVERSEE_S = 15;
export const VITESSE_RADEAU = Math.abs(BAC.cale.x - BAC.ponton.x) / DUREE_TRAVERSEE_S;
/** Haler coûte un peu d'endurance (par seconde). */
export const ENDURANCE_HALAGE = 1.2;
/** On rappelle le radeau, ou on embarque, à moins de cette distance du point d'embarquement. */
export const PORTEE_EMBARCADERE = 2.6;

/**
 * Le mouvement du radeau, tel que le serveur le décide et que le client le prolonge : sa place `x` à l'instant `depuis`,
 * puis il avance de `sens` × VITESSE_RADEAU jusqu'à son accostage (`vers`).
 */
export interface MouvementRadeau {
  x: number;
  depuis: number;
  sens: -1 | 0 | 1;
  /** L'accostage visé (sa place x), tant qu'il bouge. */
  vers?: number;
}

export const RADEAU_AU_REPOS: MouvementRadeau = { x: BAC.cale.x, depuis: 0, sens: 0 };

/** La place du radeau à cet instant. */
export function placeRadeau(m: MouvementRadeau, instant: number): number {
  if (m.sens === 0) return m.x;
  const x = m.x + m.sens * VITESSE_RADEAU * Math.max(0, instant - m.depuis) / 1000;
  const bout = m.vers ?? (m.sens > 0 ? Math.max(BAC.cale.x, BAC.ponton.x) : Math.min(BAC.cale.x, BAC.ponton.x));
  return m.sens > 0 ? Math.min(x, bout) : Math.max(x, bout);
}

/** Où est accosté le radeau (null : au milieu de l'eau). */
export function accostage(x: number): "cale" | "ponton" | null {
  if (Math.abs(x - BAC.cale.x) < 0.05) return "cale";
  if (Math.abs(x - BAC.ponton.x) < 0.05) return "ponton";
  return null;
}

/** Ce point est-il sur le plancher du radeau (à sa place `xr`) ? */
export function aBord(x: number, z: number, xr: number, marge = 0): boolean {
  return Math.abs(x - xr) <= BAC.demiLongueur + marge && Math.abs(z - BAC.z) <= BAC.demiLargeur + marge;
}

// ---------- La zone : le modèle, l'eau, et ce qui bouge ----------

/** Les obstacles qui arrêtent un coup ou un objet lancé : les murs, les talus boisés, les épaves. Le reste est bas. */
const NATURES_HAUTES = new Set(["mur", "paroi du camping-car", "cabine du camping-car", "casier", "épave", "barricade de troncs", "talus boisé", "talus (bout de la halte)", "poteau du bac"]);

/**
 * Les fenêtres à 1 m du sol que le modèle laisse passer (son export ne compte plein qu'au-dessus d'un mètre) : on les
 * referme ici, en attendant la retouche du modèle (à demander à la session « bâtiments »).
 */
const FENETRES_A_FERMER: readonly SegmentModele[] = [
  { x1: -23.8, z1: -25, x2: -23, z2: -25, nature: "mur" }, // cabane du passeur, au sud
  { x1: -34.2, z1: 23, x2: -35.4, z2: 23, nature: "mur" }, // buvette, au nord
  { x1: -35.4, z1: 30.5, x2: -34.2, z2: 30.5, nature: "mur" }, // buvette, au sud
  { x1: -31.4, z1: 30.5, x2: -30.6, z2: 30.5, nature: "mur" },
  { x1: -37, z1: 26.16, x2: -37, z2: 27.34, nature: "mur" }, // buvette, à l'ouest
  { x1: 75.5, z1: -16.64, x2: 75.5, z2: -17.86, nature: "mur" }, // cabanon du garde-pêche
  { x1: -78.8, z1: -14, x2: -78, z2: -14, nature: "mur" }, // huilerie
];

/** Un segment du modèle, en boîtes du jeu (les segments en biais : en morceaux de 0,5 m). */
function boitesDuSegment(s: SegmentModele): Boite[] {
  const ep = s.nature === "mur" ? 0.24 : s.nature.startsWith("berge") || s.nature.startsWith("talus") ? 0.3 : 0.2;
  const a = auGue(s.x1, s.z1);
  const b = auGue(s.x2, s.z2);
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const droit = Math.abs(dx) < 0.02 || Math.abs(dz) < 0.02;
  const n = droit ? 1 : Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.5));
  // Un segment droit garde sa longueur (une porte du modèle reste aussi large qu'il l'a voulue) ; en biais, les
  // morceaux se recouvrent.
  if (droit) {
    const selonX = Math.abs(dx) >= Math.abs(dz);
    return [{ x: arrondi(a.x + dx / 2), z: arrondi(a.z + dz / 2), l: arrondi(selonX ? Math.abs(dx) : ep), p: arrondi(selonX ? ep : Math.abs(dz)) }];
  }
  const boites: Boite[] = [];
  for (let i = 0; i < n; i++) {
    const cx = a.x + (dx * (i + 0.5)) / n;
    const cz = a.z + (dz * (i + 0.5)) / n;
    boites.push({ x: arrondi(cx), z: arrondi(cz), l: arrondi(Math.abs(dx) / n + ep), p: arrondi(Math.abs(dz) / n + ep) });
  }
  return boites;
}

/** Le bout du ponton : ouvert quand le radeau y est accosté. */
const BOUT_DU_PONTON = SEGMENTS_MODELE.find((s) => s.nature === "bout du ponton" && s.x1 === 9.4 && s.z1 === -26);

/** Le couloir du bac sur l'eau, entre la cale et le ponton : l'eau y est, sauf là où flotte le radeau. */
const COULOIR = (() => {
  const xa = auGue(9.4, 0).x; // le bout du ponton
  const xb = auGue(-10.6, 0).x; // le bord de la cale
  return { x0: xa, x1: xb, z0: BAC.z - BAC.demiLargeur - 0.1, z1: BAC.z + BAC.demiLargeur + 0.1 } as const;
})();

/** Les pontons de bois avancent sur l'eau : on y marche (celui du bac, celui des barques de la guinguette). */
const PONTONS = ([[12.6, -26, 9.4, -24], [-3.6, 22.6, -9, 24.2]] as const).map(([xa, za, xb, zb]) => {
  const a = auGue(xa, za);
  const b = auGue(xb, zb);
  return { x0: a.x, x1: b.x, z0: a.z, z1: b.z } as const;
});

/** L'eau : des bandes de 0,5 m entre les berges, sauf le radier, le banc, le couloir du bac et le ponton. */
function boitesDEau(): Boite[] {
  const boites: Boite[] = [];
  const pas = 0.25;
  for (let z = 0.25; z < TAILLE_GUE.largeur; z += 0.5) {
    if (z + 0.25 > RADIER.z0 - 0.05 && z - 0.25 < RADIER.z1 + 0.05) continue;
    let debut: number | null = null;
    const fermer = (x: number) => {
      if (debut === null) return;
      boites.push({ x: arrondi((debut + x) / 2), z: arrondi(z), l: arrondi(x - debut), p: 0.5 });
      debut = null;
    };
    for (let x = 60; x <= 140; x += pas) {
      const eau =
        dansLaRiviere(x + pas / 2, z) &&
        !surLeBanc(x + pas / 2, z, 0.2) &&
        !(x + pas > COULOIR.x0 && x < COULOIR.x1 && z + 0.25 > COULOIR.z0 && z - 0.25 < COULOIR.z1) &&
        !PONTONS.some((p) => x + pas > p.x0 && x < p.x1 && z + 0.25 > p.z0 && z - 0.25 < p.z1);
      if (eau && debut === null) debut = x;
      if (!eau) fermer(x);
    }
    fermer(140);
  }
  return boites;
}

const BOITES_FIXES: { hautes: Boite[]; basses: Boite[] } = (() => {
  const hautes: Boite[] = [];
  const basses: Boite[] = [];
  for (const s of [...SEGMENTS_MODELE, ...FENETRES_A_FERMER]) {
    if (s === BOUT_DU_PONTON) continue;
    (NATURES_HAUTES.has(s.nature) ? hautes : basses).push(...boitesDuSegment(s));
  }
  basses.push(...boitesDEau());
  // Au-delà des talus, au nord et au sud, la pente boisée : le modèle ne ferme pas le pied du talus au bord de la
  // rivière ; on ferme les deux lisières du lot.
  const nord = auGue(0, -32.4).z;
  const sud = auGue(0, 34.4).z;
  hautes.push({ x: TAILLE_GUE.longueur / 2, z: nord / 2, l: TAILLE_GUE.longueur, p: nord }, { x: TAILLE_GUE.longueur / 2, z: (sud + TAILLE_GUE.largeur) / 2, l: TAILLE_GUE.longueur, p: TAILLE_GUE.largeur - sud });
  return { hautes, basses };
})();
declarerObstaclesBas(BOITES_FIXES.basses);

const OBSTACLES_FIXES: readonly Boite[] = [...BOITES_FIXES.hautes, ...BOITES_FIXES.basses];
const GRILLE_FIXE: GrilleObstacles = creerGrille(OBSTACLES_FIXES);

/** Les bornes du gué (les talus et la rivière font le reste). */
const BORNES = { xMin: 0.5, xMax: TAILLE_GUE.longueur - 0.5, zMin: 0.5, zMax: TAILLE_GUE.largeur - 0.5 } as const;

/** Le gué sans rien qui bouge : le radeau à la cale, le radier découvert. `lieux.ts` en fait ZONE_GUE. */
export function zoneGueFixe(): Zone {
  return zoneGue({ radeau: BAC.cale.x, noye: false });
}

/** Ce qui change la zone : la place du radeau, le radier noyé. */
export interface EtatZoneGue {
  radeau: number;
  noye: boolean;
}

/** Une boîte basse (l'eau, le bord du radeau) : créée une fois par forme, déclarée basse. */
function basse(b: Boite): Boite {
  declarerObstaclesBas([b]);
  return b;
}

/** Le radier noyé (G4) : toute la largeur de la rivière, sur le radier. */
const RADIER_NOYE: readonly Boite[] = (() => {
  const zc = (RADIER.z0 + RADIER.z1) / 2;
  const xa = auGue(axeRiviere(-11.25) + DEMI_RIVIERE - 0.4, 0).x;
  const xb = auGue(axeRiviere(-11.25) - DEMI_RIVIERE + 0.4, 0).x;
  return [basse({ x: arrondi((xa + xb) / 2), z: zc, l: arrondi(xb - xa), p: arrondi(RADIER.z1 - RADIER.z0 + 0.3) })];
})();

/** Les obstacles du radeau à sa place `xr` : garde-corps, et ses deux bouts fermés sauf du côté où il est accosté. */
function obstaclesRadeau(xr: number): Boite[] {
  const { demiLongueur: L, demiLargeur: P, z } = BAC;
  const ou = accostage(xr);
  const boites: Boite[] = [
    { x: xr, z: z - P + 0.1, l: 2 * L, p: 0.2 },
    { x: xr, z: z + P - 0.1, l: 2 * L, p: 0.2 },
  ];
  // Le bout côté cale (x plus grand : la cale est côté terrain, à l'est du jeu), le bout côté ponton.
  const versCale = BAC.cale.x > BAC.ponton.x ? 1 : -1;
  if (ou !== "cale") boites.push({ x: xr + versCale * L, z, l: 0.2, p: 2 * P });
  if (ou !== "ponton") boites.push({ x: xr - versCale * L, z, l: 0.2, p: 2 * P });
  // L'eau du couloir, de part et d'autre du radeau.
  const bordCale = xr + versCale * L;
  const bordPonton = xr - versCale * L;
  const [a0, a1] = versCale > 0 ? [COULOIR.x0, bordPonton] : [bordPonton, COULOIR.x1];
  const [b0, b1] = versCale > 0 ? [bordCale, COULOIR.x1] : [COULOIR.x0, bordCale];
  const zc = (COULOIR.z0 + COULOIR.z1) / 2;
  const pc = COULOIR.z1 - COULOIR.z0;
  // Accosté, le radeau touche la cale (ou le ponton) : pas d'eau entre les deux.
  const [vide0, vide1] = versCale > 0 ? [ou === "ponton", ou === "cale"] : [ou === "cale", ou === "ponton"];
  if (!vide0 && a1 - a0 > 0.02) boites.push({ x: (a0 + a1) / 2, z: zc, l: a1 - a0, p: pc });
  if (!vide1 && b1 - b0 > 0.02) boites.push({ x: (b0 + b1) / 2, z: zc, l: b1 - b0, p: pc });
  if (ou !== "ponton" && BOUT_DU_PONTON) boites.push(...boitesDuSegment(BOUT_DU_PONTON));
  return boites.map((b) => basse({ x: arrondi(b.x), z: arrondi(b.z), l: arrondi(b.l), p: arrondi(b.p) }));
}

/** Les zones déjà faites (une par place du radeau au centimètre, et par état du radier) : les dernières seulement. */
const zones = new Map<string, Zone>();

/** La zone du gué pour cet état : les obstacles fixes, le radeau là où il est, le radier s'il est noyé. */
export function zoneGue(etat: EtatZoneGue): Zone {
  const cle = `${Math.round(etat.radeau * 100)}|${etat.noye ? 1 : 0}`;
  const deja = zones.get(cle);
  if (deja) return deja;
  const mobiles = [...obstaclesRadeau(etat.radeau), ...(etat.noye ? RADIER_NOYE : [])];
  // La grille fixe, et les cases que touchent les obstacles qui bougent (copiées avant d'y ajouter).
  const ajout = creerGrille(mobiles, GRILLE_FIXE.taille);
  const cases = new Map(GRILLE_FIXE.cases);
  for (const [k, liste] of ajout.cases) cases.set(k, [...(cases.get(k) ?? []), ...liste]);
  const zone: Zone = { ...BORNES, obstacles: [...OBSTACLES_FIXES, ...mobiles], grille: { taille: GRILLE_FIXE.taille, cases } };
  if (zones.size > 12) zones.delete(zones.keys().next().value!);
  zones.set(cle, zone);
  return zone;
}

// ---------- Le contenu (B5 à B8, I11, R-BUTIN) ----------

/**
 * Le butin du gué (le moteur : serveur/src/lieu-vivant.ts) : les pierres reviennent en 30 min (B4) et grandissent avec
 * les voyageurs (B8, 15 pour un voyageur seul : B5) ; le banc de galets personnel, 8 pierres à chacun, revient en 6 h
 * (REPOUSSE_MS.banc_galets). Le gisement de glaise est inépuisable (B6), les joncs repoussent en 30 min (B7).
 */
export const BUTIN_GUE: ButinLieu = {
  repousse: { pierre: 30 * 60_000 },
  vrac: { pierre: 15 },
  personnel: { banc_galets: 8 },
};

/** Les fouilles du gué (« par chance » : bâche, chiffons, casserole, cordes ; rarement une clé de L1). */
export const FOUILLES_GUE = ["gue_cabane", "gue_buvette", "gue_barques", "gue_camping_car", "gue_lavoir", "gue_garde_peche"] as const;
export type FouilleGue = (typeof FOUILLES_GUE)[number];

/** Le point du modèle de chaque fouille (la fiche du modèle, `fouille`). */
const PLACES_FOUILLES: Record<FouilleGue, readonly [number, number]> = {
  gue_cabane: [-21.6, -28.9],
  gue_buvette: [-31.2, 26.5],
  gue_barques: [-12, 20],
  gue_camping_car: [21.6, 13.6],
  gue_lavoir: [28, -26.4],
  gue_garde_peche: [73, -18.6],
};

/** Les quatre-vingt-dix (au plus) ressources du gué, à la première visite (les mêmes pour tous). */
export function genererGue(): Omit<RessourceSol, "disponible">[] {
  const ressources: Omit<RessourceSol, "disponible">[] = [];
  const poser = (type: TypeRessource, p: { x: number; z: number }) => ressources.push({ id: ressources.length + 1, type, x: arrondi(p.x), z: arrondi(p.z) });
  // Le banc de galets personnel, au bord du banc, côté radier ; le gisement de glaise ; les joncs.
  poser("banc_galets", auGue(5.7, -8.6));
  poser("gisement_glaise", GLAISE);
  for (const [x, z] of JONCS_MODELE) poser("joncs", auGue(x, z));
  for (const f of FOUILLES_GUE) poser(f, auGue(...PLACES_FOUILLES[f]));
  // Le « bois flotté » du modèle devient un tas de branches (I11) : il est contre la pile, dans l'eau ; la crue en a
  // poussé une partie sur la berge, au pied de la culée côté terrain.
  for (const [x, z] of [[-11.3, -5.2], [-11.9, -4.6], [-11.4, -3.9], [-12.2, -5.6], [-12.6, -4.2]] as const) poser("branche", auGue(x, z));

  // Les pierres en vrac (B5, B8) : VRAC_MAX tournées de 15, dont seule la première est en jeu pour un voyageur seul.
  // La première sur le banc de galets ; les autres sur les pistes de gravier qui descendent au radier.
  const aleat = aleatoire(1187);
  const zone = zoneGueFixe();
  const libre = (x: number, z: number, ecart: number) =>
    !zone.obstacles.some((b) => Math.abs(x - b.x) <= b.l / 2 + 0.45 && Math.abs(z - b.z) <= b.p / 2 + 0.45) &&
    ressources.every((r) => Math.hypot(r.x - x, r.z - z) > ecart) &&
    Math.hypot(x - FEU_DU_BANC.x, z - FEU_DU_BANC.z) > 1.1;
  const placer = (n: number, tirer: () => { x: number; z: number }, ecart: number) => {
    for (let i = 0; i < n; i++) {
      let p = tirer();
      for (let essai = 0; essai < 80 && !libre(p.x, p.z, ecart); essai++) p = tirer();
      poser("pierre", p);
    }
  };
  const surLeBancAuHasard = () => {
    const t = aleat();
    const a = aleat() * Math.PI * 2;
    const r = Math.sqrt(aleat()) * (BANC_MODELE.r - 0.35);
    return auGue(BANC_MODELE.a[0] + (BANC_MODELE.b[0] - BANC_MODELE.a[0]) * t + Math.cos(a) * r, BANC_MODELE.a[1] + (BANC_MODELE.b[1] - BANC_MODELE.a[1]) * t + Math.sin(a) * r);
  };
  const pistes = [
    [[-34, -0.6], [-27, -3], [-20, -7], [-15, -10.2]],
    [[17, -10.4], [22, -7.6], [28, -3.6], [35, -0.8]],
  ] as const;
  const surLesPistes = () => {
    const piste = pistes[aleat() < 0.5 ? 0 : 1];
    const i = Math.floor(aleat() * (piste.length - 1));
    const t = aleat();
    const [a, b] = [piste[i]!, piste[i + 1]!];
    return auGue(a[0] + (b[0] - a[0]) * t + (aleat() - 0.5) * 3.2, a[1] + (b[1] - a[1]) * t + (aleat() - 0.5) * 3.2);
  };
  placer(BUTIN_GUE.vrac!.pierre!, surLeBancAuHasard, 0.5);
  for (let tour = 1; tour < VRAC_MAX; tour++) placer(BUTIN_GUE.vrac!.pierre!, surLesPistes, 0.9);
  return ressources;
}

/** Le feu des survivants, au milieu du banc (le modèle) : on n'y pose pas de pierres. */
const FEU_DU_BANC = auGue(6.3, -7.4);

// ---------- Les Éteints : les 11 du modèle (Q-0.8-23) ----------

/** L'Éteint qui dérive (G2) : dans l'eau, côté amont du radier ; il suit le bord et agrippe les chevilles. */
export const ID_DERIVE = 6;
/** Il dérive contre le bord amont du radier, dans l'eau. */
export const LIGNE_DERIVE = { z: RADIER.z0 - 0.35, x0: RADIER.x0 + 1.2, x1: RADIER.x1 - 1.2, vitesse: 0.35 } as const;
/** Il agrippe qui marche à moins de ce nombre de mètres du bord amont (et à moins d'un mètre de lui le long du bord). */
export const BORD_DANGEREUX = 0.9;

function eteint(id: number, x: number, z: number, etat: Eteint["etat"], o = 0): Eteint {
  return { id, x, z, o, etat, attention: 0, but: null, perdu: 0, flane: 0, degats: 0, etourdi: 0, aTerre: 0, saisit: null, tenue: 0, contact: 0, corps: 0 };
}

/**
 * Les Éteints du gué : ceux du modèle, à leur place. Les errants errent ; les anciens habitants (la serveuse, le
 * garde-pêche) somnolent debout ; les rampants dorment dans la vase ; celui qui dérive est au sol, dans l'eau.
 */
export function eteintsGue(): Eteint[] {
  return ETEINTS_MODELE.map((m, i) => {
    const id = i + 1;
    const p = auGue(m.x, m.z);
    const type = m.type ?? "";
    if (id === ID_DERIVE) {
      const e = eteint(id, p.x, LIGNE_DERIVE.z, "errant", Math.PI);
      e.variante = "rampant";
      e.retenu = Infinity;
      return e;
    }
    if (type.startsWith("rampant")) {
      const e = eteint(id, p.x, p.z, "dormant", 1.2 * i);
      e.variante = "rampant";
      e.dormeur = true;
      e.maison = { ...p };
      return e;
    }
    if (type.startsWith("ancien habitant")) {
      const e = eteint(id, p.x, p.z, "dormant", 0.7 * i);
      e.dormeur = true;
      e.maison = { ...p };
      return e;
    }
    const e = eteint(id, p.x, p.z, "errant", 0.9 * i);
    e.maison = { ...p };
    return e;
  });
}

// ---------- Les ricochets (G8) ----------

/** Un galet lancé bien tendu (le bouton tenu au moins ce temps) ricoche sur l'eau. */
export const GESTE_RICOCHET_MS = 700;
/** Le bruit d'un galet qui touche l'eau (« plouf »), et de chaque rebond. */
export const BRUIT_PLOUF = { portee: 8, duree: 1 } as const;
export const BRUIT_REBOND = { portee: 4, duree: 0.4 } as const;

/** Ce que devient un galet qui tombe dans l'eau : ses rebonds, où il s'arrête, et s'il est perdu. */
export interface Ricochet {
  /** Le premier contact avec l'eau, puis chaque rebond. */
  rebonds: { x: number; z: number }[];
  /** Où il finit : sur l'autre rive (ramassable), ou au fond de l'eau (perdu). */
  fin: { x: number; z: number };
  perdu: boolean;
}

/**
 * Un galet qui tombe en (`vers`), lancé de `de` : s'il tombe dans la rivière, il fait « plouf » ; bien lancé (geste long),
 * il ricoche par bonds qui raccourcissent jusqu'à la rive d'en face, ou coule s'il n'y arrive pas. null : il ne
 * tombe pas dans l'eau.
 */
export function ricochet(de: { x: number; z: number }, vers: { x: number; z: number }, bienLance: boolean): Ricochet | null {
  if (!dansLaRiviere(vers.x, vers.z) || surLeRadier(vers.x, vers.z) || surLeBanc(vers.x, vers.z)) return null;
  if (!bienLance) return { rebonds: [vers], fin: vers, perdu: true };
  const l = Math.hypot(vers.x - de.x, vers.z - de.z) || 1;
  const ux = (vers.x - de.x) / l;
  const uz = (vers.z - de.z) / l;
  const rebonds = [vers];
  let p = vers;
  let bond = 4.5;
  for (let i = 0; i < 12; i++) {
    const suivant = { x: arrondi(p.x + ux * bond), z: arrondi(p.z + uz * bond) };
    if (!dansLaRiviere(suivant.x, suivant.z) || surLeRadier(suivant.x, suivant.z) || surLeBanc(suivant.x, suivant.z)) {
      // Il touche la rive : il glisse encore un peu sur les galets de la berge.
      return { rebonds, fin: { x: arrondi(suivant.x + ux * 0.8), z: arrondi(suivant.z + uz * 0.8) }, perdu: false };
    }
    rebonds.push(suivant);
    p = suivant;
    bond = Math.max(1.6, bond * 0.8);
  }
  return { rebonds, fin: p, perdu: true };
}

// ---------- La vue : la cabane du passeur et la buvette (0.7.2) ----------

/** Les murs (hauts) d'un rectangle du modèle, en boîtes du jeu. */
function mursDans(x1: number, z1: number, x2: number, z2: number): Boite[] {
  const dans = (s: SegmentModele) => Math.min(s.x1, s.x2) >= x1 - 0.05 && Math.max(s.x1, s.x2) <= x2 + 0.05 && Math.min(s.z1, s.z2) >= z1 - 0.05 && Math.max(s.z1, s.z2) <= z2 + 0.05;
  return [...SEGMENTS_MODELE, ...FENETRES_A_FERMER].filter((s) => s.nature === "mur" && dans(s)).flatMap(boitesDuSegment);
}

/** Les deux pièces où l'on entre (la vue par pièce) ; le reste du gué est à ciel ouvert. */
const CABANE = { x0: auGue(-21, 0).x, x1: auGue(-27, 0).x, z0: auGue(0, -29.5).z, z1: auGue(0, -25).z } as const;
const BUVETTE = { x0: auGue(-29, 0).x, x1: auGue(-37, 0).x, z0: auGue(0, 23).z, z1: auGue(0, 30.5).z } as const;

export const PLAN_GUE: PlanVue = (() => {
  const porteCabane = auGue(-21, -27.05);
  const porteBuvette = auGue(-31.4, 23);
  const passage = auGue(-33, 28.78);
  const comptoir = auGue(-29, 26.75);
  const portes: PorteVue[] = [
    { id: "cabane", x: porteCabane.x, z: porteCabane.z, largeur: 0.8, sens: "z", entre: ["dehors", "cabane"], toujoursOuverte: true },
    { id: "buvette", x: porteBuvette.x, z: porteBuvette.z, largeur: 0.8, sens: "x", entre: ["dehors", "buvette"], toujoursOuverte: true },
    { id: "reserve", x: passage.x, z: passage.z, largeur: 0.8, sens: "z", entre: ["buvette", "buvette"], toujoursOuverte: true },
  ];
  // Le comptoir ouvert sur la piste de danse (le mur plein jusqu'à 1,05 m, le vide au-dessus) : on voit par-dessus.
  const fenetres: FenetreVue[] = [{ id: "comptoir", x: comptoir.x, z: comptoir.z, largeur: 4.2, sens: "z", entre: ["dehors", "buvette"] }];
  const murs = [...mursDans(-27, -29.5, -21, -25), ...mursDans(-37, 23, -29, 30.5)];
  const dansRect = (x: number, z: number, r: { x0: number; x1: number; z0: number; z1: number }) => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1;
  return {
    murs: percer(murs, fenetres),
    portes,
    fenetres,
    pieceDe: (x, z) => (dansRect(x, z, CABANE) ? "cabane" : dansRect(x, z, BUVETTE) ? "buvette" : "dehors"),
    pieces: ["dehors", "cabane", "buvette"],
  };
})();
