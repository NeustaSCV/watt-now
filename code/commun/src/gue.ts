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
import { SEMIS, vracDuSemis, type Etendue, type Semes } from "./semis.ts";
import { VRAC_MAX, aleatoire, type ButinLieu, type RessourceSol, type TypeRessource } from "./terrain.ts";
import { percer, type FenetreVue, type PlanVue, type PorteVue } from "./vue.ts";
import { BAC_MODELE, ETEINTS_MODELE, FOUILLE_MODELE, NAPPE_MODELE, SEGMENTS_MODELE, type SegmentModele } from "./gue-modele.ts";

/** À augmenter quand le contenu du gué change : la base le régénère alors. */
export const VERSION_GUE = 5;

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

/**
 * Le gisement de glaise (B6), au point de la fiche du modèle : au milieu de la berge de vase, à découvert, au sud du
 * coin repas du camping-car. Le modèle y dessine la motte entamée et la bêche, et rien ne pousse autour ni entre lui et
 * la caméra (R2 : la retouche demandée par le plan 0.8.2, livrée pour la 0.8.3 ; le jeu n'a plus rien à déplacer).
 */
export const GLAISE = (() => {
  const p = FOUILLE_MODELE.find((f) => f.quoi?.startsWith("gisement de glaise"))!;
  return auGue(p.x, p.z);
})();

// ---------- Le fond de vallée (repris du modèle : ZR, VN, VS, HL) ----------

/** L'axe de la route (repère du modèle : z selon x). */
export const ZR_MODELE: readonly (readonly [number, number])[] = [[-101, 7], [-85, 6.5], [-65, 4], [-48, 1], [-36, 0], [30, 0], [50, -1], [70, -3], [101, -5]];
/** Le pied du talus nord, puis du talus sud (repère du modèle : z selon x) : au-delà, la pente boisée. */
export const VN_MODELE: readonly (readonly [number, number])[] = [[-101, 1.8], [-86, 1.4], [-84, -26], [-65, -26], [-62, -1.2], [-56, -2.6], [-46, -31], [44, -31], [54, -7.5], [66, -7.5], [68, -21.5], [86, -21.5], [88, -8.8], [101, -9.2]];
export const VS_MODELE: readonly (readonly [number, number])[] = [[-101, 11.2], [-72, 10.4], [-69.5, 14], [-59, 14], [-56.5, 8.2], [-47, 33], [44, 33], [54, 4], [101, 0.6]];

/** Une table (x croissants) lue en x, linéaire entre ses points. */
export function interpoler(table: readonly (readonly [number, number])[], x: number): number {
  if (x <= table[0]![0]) return table[0]![1];
  for (let i = 1; i < table.length; i++) {
    const [xb, yb] = table[i]!;
    if (x <= xb) {
      const [xa, ya] = table[i - 1]!;
      return ya + ((yb - ya) * (x - xa)) / (xb - xa);
    }
  }
  return table[table.length - 1]![1];
}

/** L'axe de la route au gué (z du jeu) pour un x du jeu. */
export function zRoute(x: number): number {
  return interpoler(ZR_MODELE, Math.max(-101, Math.min(101, 100 - x))) + 35;
}
/** Demi-largeur de la route (le modèle : HL). */
export const DEMI_ROUTE = 2.8;
/** Le trou du pont emporté (x du jeu) : entre les deux culées, plus de route, la rivière. */
export const TROU_DU_PONT = { x0: auGue(13.6, 0).x, x1: auGue(-9.3, 0).x } as const;

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

/**
 * R19 (plan 0.8.2, chantier F) : la ligne dite à qui bute au bord du radier noyé, une fois par tentative (on la redit
 * quand il s'est éloigné puis revient essayer).
 */
export const LIGNE_RADIER_NOYE = "La rivière est en crue : le radier est sous l'eau. Le bac passe toujours.";
/** On bute au bord du radier noyé à moins de `pres` mètres de l'eau ; on s'en est éloigné au-delà de `eloigne`. */
export const BORD_RADIER = { pres: 0.9, eloigne: 3 } as const;

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

/**
 * Plan 0.8.2 (chantier F, R3) : on est « à bord » pour haler dès qu'on pose le pied sur le plancher, bouts compris :
 * le rayon du personnage (0,35 m) et un peu de jeu. L'écran et le serveur prennent la même marge.
 */
export const MARGE_A_BORD = 0.45;

/** Ce point est-il sur le plancher du radeau (à sa place `xr`) ? */
export function aBord(x: number, z: number, xr: number, marge = 0): boolean {
  return Math.abs(x - xr) <= BAC.demiLongueur + marge && Math.abs(z - BAC.z) <= BAC.demiLargeur + marge;
}

/**
 * Plan 0.8.2 §7.6 : au bord du radeau à quai, sur la cale ou le ponton, « Haler le bac » se propose déjà : jusqu'à
 * cette distance (m) du bout du plancher qui touche le quai, sur toute sa largeur. On monte à bord d'un pas en halant.
 */
export const BORD_DU_RADEAU = 1.2;

/** Le côté du quai où le radeau est accosté (+1 : vers +x, −1 : vers −x), ou 0 s'il est au milieu de l'eau. */
function coteDuQuai(xr: number): -1 | 0 | 1 {
  const ou = accostage(xr);
  if (!ou) return 0;
  return BAC[ou].embarquement.x > xr ? 1 : -1;
}

/** Est-on au bord du radeau à quai (sur le quai, contre son bout), ou déjà à bord ? */
export function auBordDuRadeau(x: number, z: number, xr: number): boolean {
  if (aBord(x, z, xr, MARGE_A_BORD)) return true;
  const sens = coteDuQuai(xr);
  if (sens === 0 || Math.abs(z - BAC.z) > BAC.demiLargeur) return false;
  const hors = sens * (x - (xr + sens * BAC.demiLongueur));
  return hors >= 0 && hors <= BORD_DU_RADEAU;
}

/** La place sur le plancher la plus proche (entre les garde-corps, à un pas des bouts) : où l'on monte pour haler. */
export function surLePlancher(x: number, z: number, xr: number): { x: number; z: number } {
  const bord = (v: number, c: number, demi: number) => Math.min(c + demi, Math.max(c - demi, v));
  return { x: bord(x, xr, BAC.demiLongueur - 0.5), z: bord(z, BAC.z, BAC.demiLargeur - 0.6) };
}

// ---------- La zone : le modèle, l'eau, et ce qui bouge ----------

/** Les obstacles qui arrêtent un coup ou un objet lancé : les murs, les talus boisés, les épaves. Le reste est bas. */
const NATURES_HAUTES = new Set(["mur", "paroi du camping-car", "cabine du camping-car", "casier", "épave", "barricade de troncs", "talus boisé", "talus (bout de la halte)", "poteau du bac"]);

/** Les bords qui tombent dans l'eau : ils n'arrêtent qu'au-dessus de l'eau (plan 0.8.2). */
const NATURES_AU_BORD_DE_LEAU = new Set(["bord amont du radier", "bord aval du radier (chute)", "bord de la cale"]);

/** Là où la barrière de chantier est tombée (z du jeu) : plus rien ne s'y dresse. */
const BARRIERE_TOMBEE = { z0: 33.3, z1: 35.0 } as const;

/** Une boîte longue en morceaux de 0,5 m au plus, le long de sa grande dimension. */
function enMorceaux(b: Boite): Boite[] {
  const selonX = b.l >= b.p;
  const long = selonX ? b.l : b.p;
  const n = Math.max(1, Math.ceil(long / 0.5 - 1e-9));
  const morceaux: Boite[] = [];
  for (let i = 0; i < n; i++) {
    const d = -long / 2 + (long * (i + 0.5)) / n;
    morceaux.push(selonX ? { x: arrondi(b.x + d), z: b.z, l: arrondi(long / n), p: b.p } : { x: b.x, z: arrondi(b.z + d), l: b.l, p: arrondi(long / n) });
  }
  return morceaux;
}

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


/** Le couloir du bac sur l'eau, entre la cale et le ponton : l'eau y est, sauf là où flotte le radeau. */
const COULOIR = (() => {
  const xa = auGue(9.4, 0).x; // le bout du ponton
  const xb = auGue(-10.6, 0).x; // le bord de la cale
  return { x0: xa, x1: xb, z0: BAC.z - BAC.demiLargeur - 0.1, z1: BAC.z + BAC.demiLargeur + 0.1 } as const;
})();

/**
 * Plan 0.8.2 §7.6 : au bout du ponton (et de la cale), l'eau et les bords s'arrêtent à un rayon de personnage du
 * radeau à quai. On y monte alors sur toute la largeur du plancher, et non plus par le seul mètre du ponton : venu en
 * biais, on ne bute plus sur le coin.
 */
const RAYON_ABORD = 0.35;

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
        !(x + pas > COULOIR.x0 - RAYON_ABORD && x < COULOIR.x1 + RAYON_ABORD && z + 0.25 > COULOIR.z0 && z - 0.25 < COULOIR.z1) &&
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
  for (const s of SEGMENTS_MODELE) {
    let boites = boitesDuSegment(s);
    // Plan 0.8.2 (chantier F) : les bords qui tombent dans l'eau (radier, cale) ne s'arrêtent qu'au-dessus de l'eau.
    // Le modèle les prolonge d'un mètre sur la terre ferme, où rien ne se voit : une barrière invisible au pied des
    // têtes du radier et le long de la cale (obstacles-visibles.test.ts).
    if (NATURES_AU_BORD_DE_LEAU.has(s.nature)) boites = boites.flatMap(enMorceaux).filter((b) => dansLaRiviere(b.x, b.z, -0.3));
    // La barrière tombée (le modèle en couche une sur quatre, au hasard de l'usure) laisse un passage vers la culée :
    // on y passe, comme on le voit (l'eau arrête au bord).
    // Le bout des bords du ponton du bac, contre le radeau à quai : ôté (RAYON_ABORD).
    if (s.nature === "bord du ponton") boites = boites.flatMap(enMorceaux).filter((b) => Math.abs(b.z - BAC.z) > 3 || b.x + b.l / 2 <= COULOIR.x0 - RAYON_ABORD + 0.01);
    if (s.nature.startsWith("barrières de chantier")) boites = boites.flatMap(enMorceaux).filter((b) => b.z < BARRIERE_TOMBEE.z0 || b.z > BARRIERE_TOMBEE.z1);
    (NATURES_HAUTES.has(s.nature) ? hautes : basses).push(...boites);
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

/**
 * Bute-t-on au bord du radier noyé (R19) ? Sur la rive, face à l'eau, à moins de BORD_RADIER.pres de la nappe qui
 * couvre le radier. `o` : l'orientation du joueur (atan2(dx, dz)) ; null : on ne la regarde pas.
 */
export function auBordDuRadierNoye(x: number, z: number, o: number | null = null): boolean {
  const b = RADIER_NOYE[0]!;
  if (z < b.z - b.p / 2 || z > b.z + b.p / 2) return false;
  const ouest = b.x - b.l / 2;
  const est = b.x + b.l / 2;
  if (x >= est && x - est <= BORD_RADIER.pres) return o === null || Math.sin(o) < -0.3;
  if (x <= ouest && ouest - x <= BORD_RADIER.pres) return o === null || Math.sin(o) > 0.3;
  return false;
}

/** S'est-on assez éloigné du radier noyé pour qu'une nouvelle tentative se dise à nouveau ? */
export function loinDuRadierNoye(x: number, z: number): boolean {
  const b = RADIER_NOYE[0]!;
  const dx = Math.max(0, b.x - b.l / 2 - x, x - (b.x + b.l / 2));
  const dz = Math.max(0, b.z - b.p / 2 - z, z - (b.z + b.p / 2));
  return Math.hypot(dx, dz) > BORD_RADIER.eloigne;
}

/**
 * Les obstacles du radeau à sa place `xr` (le modèle : ses garde-corps, toujours ; les chaînes de ses deux bouts,
 * fermées pendant la traversée, ouvertes à quai), et l'eau du couloir de part et d'autre : à quai, on monte et on
 * descend par le bout qui touche la cale ou le ponton ; l'autre bout donne sur l'eau.
 */
function obstaclesRadeau(xr: number): Boite[] {
  const ou = accostage(xr);
  // Relatifs au centre du radeau, dans le repère de la fiche : retournés (x → −x) et posés à sa place.
  const segments = [...BAC_MODELE.obstacles, ...(ou === null ? BAC_MODELE.obstaclesTraversee : [])];
  const boites: Boite[] = segments.flatMap((s) => boitesDuSegment({ ...s, x1: auModele(xr, 0).x + s.x1, x2: auModele(xr, 0).x + s.x2, z1: BAC_MODELE.cable.z + s.z1, z2: BAC_MODELE.cable.z + s.z2 }));
  const L = BAC.demiLongueur;
  // L'eau du couloir, de part et d'autre du radeau (la cale est côté terrain, à l'est du jeu).
  const versCale = BAC.cale.x > BAC.ponton.x ? 1 : -1;
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
 * les voyageurs (B8, 15 sur le banc pour un voyageur seul : B5) ; le banc de galets personnel, 8 pierres à chacun,
 * revient en 6 h (REPOUSSE_MS.banc_galets). Le gisement de glaise est inépuisable (B6), les joncs repoussent en 30 min (B7).
 *
 * Plan 0.8.2 (chantier F, R1, Q-0.8.2-1) : plus à ramasser hors du banc de galets. Pour un voyageur seul : 6 pierres de
 * plus sur les pistes qui descendent au radier (21 en vrac : 15 sur le banc, 6 sur les pistes) ; 4 bûches en vrac au
 * pied des talus, qui grandissent avec les voyageurs comme à la station ; 8 branches en tout (décision du porteur) : les
 * 5 du tas de bois flotté et 3 sur les berges. Les branches et les bûches reviennent en 30 min, comme les pierres.
 */
export const BUTIN_GUE: ButinLieu = {
  // Les nombres et les délais sont dans la table du semis (plan 0.9, semis.ts).
  repousse: { ...SEMIS.gue.repousse },
  vrac: vracDuSemis("gue"),
  personnel: { banc_galets: 8 },
};
/** Les pierres en vrac sur le banc de galets (pour un voyageur seul) ; le reste du vrac est sur les pistes. */
export const PIERRES_DU_BANC = SEMIS.gue.lignes.pierres_banc!.n;
/** Les branches du gué d'avant la 0.9 : 8 en tout, dont celles du tas de bois flotté ; les autres, éparses sur les berges. */
const BRANCHES_DU_TAS = SEMIS.gue.lignes.branches_tas!.n;
export const BRANCHES_EPARSES = SEMIS.gue.lignes.branches_berges!.n;
export const BRANCHES_DU_GUE = BRANCHES_DU_TAS + BRANCHES_EPARSES;

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
  return semerGue().ressources;
}

/** Les pistes de gravier du radier, sans leur dernier tronçon (où l'on pose des pierres). */
const PISTES_PIERRES = [
  [[-34, -0.6], [-27, -3], [-20, -7], [-15, -10.2]],
  [[17, -10.4], [22, -7.6], [28, -3.6], [35, -0.8]],
] as const;

/** Libre pour une pierre : hors des obstacles (et de l'eau), loin du feu du banc. */
function librePierre(x: number, z: number): boolean {
  return !zoneGueFixe().obstacles.some((b) => Math.abs(x - b.x) <= b.l / 2 + 0.45 && Math.abs(z - b.z) <= b.p / 2 + 0.45) && Math.hypot(x - FEU_DU_BANC.x, z - FEU_DU_BANC.z) > 1.1;
}

/**
 * Le fond de vallée à pied sec (plan 0.8.2, R1) : hors de l'eau, de la route et des pistes, des obstacles, des sorties,
 * du pied du bac, de la cloche et de la glaise. Le bois du gué s'y pose ; la pelouse du semis 0.9 aussi (semis-lieux.ts).
 */
export function auSecGue(x: number, z: number): boolean {
  const m = auModele(x, z);
  return (
    Math.abs(m.x - axeRiviere(m.z)) > DEMI_RIVIERE + 0.6 &&
    Math.abs(z - zRoute(x)) > DEMI_ROUTE + 1.2 &&
    distPistes(m.x, m.z) > 2.2 &&
    !zoneGueFixe().obstacles.some((b) => Math.abs(x - b.x) <= b.l / 2 + 0.6 && Math.abs(z - b.z) <= b.p / 2 + 0.6) &&
    SORTIES_A_EVITER.every((s) => Math.hypot(s.x - x, s.z - z) > 6) &&
    // Rien au pied du bac ni de la cloche : on y hale et on y sonne sans viser une branche.
    [BAC.cale.embarquement, BAC.ponton.embarquement, CLOCHE, GLAISE].every((q) => Math.hypot(q.x - x, q.z - z) > 4.5) &&
    !(Math.abs(z - BAC.z) < BAC.demiLargeur + 3 && x > Math.min(...BAC.poteaux) - 2 && x < Math.max(...BAC.poteaux) + 2)
  );
}

/**
 * Les étendues du semis d'avant (plan 0.9 : un point pris y revient ailleurs) : le banc de galets et les pistes du radier
 * (les pierres), les berges (les branches), le pied des talus (les bûches). Les tirages sont ceux de la 0.8.2.
 */
export const ETENDUES_GUE: Readonly<Record<"banc" | "pistes" | "berges" | "talus", Etendue>> = {
  banc: {
    tirer: (a) => {
      const t = a();
      const angle = a() * Math.PI * 2;
      const r = Math.sqrt(a()) * (BANC_MODELE.r - 0.35);
      return auGue(BANC_MODELE.a[0] + (BANC_MODELE.b[0] - BANC_MODELE.a[0]) * t + Math.cos(angle) * r, BANC_MODELE.a[1] + (BANC_MODELE.b[1] - BANC_MODELE.a[1]) * t + Math.sin(angle) * r);
    },
    libre: librePierre,
  },
  pistes: {
    tirer: (a) => {
      const piste = PISTES_PIERRES[a() < 0.5 ? 0 : 1];
      const i = Math.floor(a() * (piste.length - 1));
      const t = a();
      const [p, q] = [piste[i]!, piste[i + 1]!];
      return auGue(p[0] + (q[0] - p[0]) * t + (a() - 0.5) * 3.2, p[1] + (q[1] - p[1]) * t + (a() - 0.5) * 3.2);
    },
    libre: librePierre,
  },
  // Les branches : à moins de 4 m de la crête de berge, de part et d'autre de la rivière, du nord au sud du lot.
  berges: {
    tirer: (a) => {
      const zm = -28 + a() * 56;
      const cote = a() < 0.5 ? -1 : 1;
      return auGue(axeRiviere(zm) + cote * (DEMI_RIVIERE + 0.8 + a() * 3.2), zm);
    },
    libre: auSecGue,
  },
  // Les bûches : au pied des talus nord et sud, dans le fond de vallée (x du modèle entre −44 et 42).
  talus: {
    tirer: (a) => {
      const xm = -44 + a() * 86;
      const nord = a() < 0.5;
      const zm = nord ? interpoler(VN_MODELE, xm) + 0.8 + a() * 2.5 : interpoler(VS_MODELE, xm) - 0.8 - a() * 2.5;
      return auGue(xm, zm);
    },
    libre: auSecGue,
  },
};

/** Le contenu du gué, et la ligne du semis de chaque point semé (plan 0.9 : semis.ts). */
export function semerGue(): { ressources: Omit<RessourceSol, "disponible">[]; semes: Semes } {
  const ressources: Omit<RessourceSol, "disponible">[] = [];
  const semes: Semes = new Map();
  const poser = (type: TypeRessource, p: { x: number; z: number }, ligne?: string, tour = 0) => {
    const id = ressources.length + 1;
    ressources.push({ id, type, x: arrondi(p.x), z: arrondi(p.z) });
    if (ligne) semes.set(id, { ligne, tour });
  };
  // Le banc de galets personnel, au bord du banc, côté radier ; le gisement de glaise ; les joncs.
  poser("banc_galets", auGue(5.7, -8.6));
  poser("gisement_glaise", GLAISE);
  for (const [x, z] of JONCS_MODELE) poser("joncs", auGue(x, z));
  for (const f of FOUILLES_GUE) poser(f, auGue(...PLACES_FOUILLES[f]));
  // Le « bois flotté » du modèle devient un tas de branches (I11) : tiré sur la berge par le modèle, au pied de la
  // culée côté terrain. Cinq branches, autour de son point de fouille.
  const tas = FOUILLE_MODELE.find((f) => f.quoi?.startsWith("tas de branches"))!;
  for (const [dx, dz] of ([[0, 0], [-0.6, 0.5], [-0.3, -0.6], [-0.9, -0.2], [0.4, 0.6]] as const).slice(0, BRANCHES_DU_TAS)) poser("branche", auGue(tas.x + dx, tas.z + dz), "branches_tas");

  // Les pierres en vrac (B5, B8) : VRAC_MAX tournées, dont seule la première est en jeu pour un voyageur seul.
  // La première sur le banc de galets ; les autres sur les pistes de gravier qui descendent au radier.
  const L = SEMIS.gue.lignes;
  const aleat = aleatoire(1187);
  const placer = (nom: string, n: number, tour: number) => {
    const ligne = L[nom]!;
    const e = ETENDUES_GUE[ligne.ou as keyof typeof ETENDUES_GUE];
    const libre = (p: { x: number; z: number }) => e.libre(p.x, p.z) && ressources.every((r) => Math.hypot(r.x - p.x, r.z - p.z) > ligne.ecart);
    for (let i = 0; i < n; i++) {
      let p = e.tirer(aleat);
      for (let essai = 0; essai < 80 && !libre(p); essai++) p = e.tirer(aleat);
      poser("pierre", p, nom, tour);
    }
  };
  // Le vrac est en jeu par rang (l'ordre de pose) : la première tournée d'abord, le banc puis les pistes (R1).
  const parTournee = L.pierres_banc!.n + L.pierres_pistes!.n;
  placer("pierres_banc", L.pierres_banc!.n, 0);
  placer("pierres_pistes", L.pierres_pistes!.n, 0);
  for (let tour = 1; tour < VRAC_MAX; tour++) placer("pierres_pistes", parTournee, tour);

  // Plan 0.8.2 (R1) : le bois. Dans le fond de vallée, à pied sec, hors de la route et des pistes, à l'écart des
  // fouilles : les branches au bord de l'eau (apportées par les crues), les bûches au pied des talus (tombées des
  // frênes et des aulnes). Le tirage est fixe : tous les voyageurs voient les mêmes.
  const bois = aleatoire(4409);
  const poserBois = (nom: string, tour: number) => {
    const ligne = L[nom]!;
    const e = ETENDUES_GUE[ligne.ou as keyof typeof ETENDUES_GUE];
    for (let i = 0; i < ligne.n; i++) {
      for (let essai = 0; essai < 400; essai++) {
        const p = e.tirer(bois);
        if (!e.libre(p.x, p.z) || !ressources.every((r) => Math.hypot(r.x - p.x, r.z - p.z) > ligne.ecart)) continue;
        poser(ligne.type, p, nom, tour);
        break;
      }
    }
  };
  poserBois("branches_berges", 0);
  // Les bûches (vrac, B8).
  for (let tour = 0; tour < VRAC_MAX; tour++) poserBois("buches_talus", tour);
  return { ressources, semes };
}

/** Les pistes de gravier qui descendent au radier (repère du modèle), de chaque côté. */
const PISTES_MODELE = [
  [[-34, -0.6], [-27, -3], [-20, -7], [-15, -10.2], [-11.6, -11.25]],
  [[13.7, -11.25], [17, -10.4], [22, -7.6], [28, -3.6], [35, -0.8]],
] as const;
function distPistes(xm: number, zm: number): number {
  let d = Infinity;
  for (const piste of PISTES_MODELE) for (let i = 0; i < piste.length - 1; i++) d = Math.min(d, distSegment(xm, zm, piste[i]!, piste[i + 1]!));
  return d;
}
/** Les arrivées des deux sorties : on n'y pose rien (on arrive libre). */
const SORTIES_A_EVITER = [auGue(-100, 7), auGue(100, -5)];

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

// ---------- Le chemin des Éteints : la chicane de l'entrée (plan 0.8.2, recette de la 0.8) ----------

/**
 * Les barricades de troncs du modèle (la chicane de l'entrée, côté Moulin), en segments du jeu, droits selon z. Un
 * Éteint « ne contourne rien » (Book 06 §2.1) : face aux troncs, il restait collé, à deux pas du joueur, de l'autre
 * côté. Le gué lui donne un milieu (comme la Coopérative pour ses portes) dont le seul effet est le passage par le
 * bout ouvert de la chicane ; la vue, le son et la nuit restent ceux du plein air.
 */
const BARRICADES: readonly { x: number; z0: number; z1: number }[] = SEGMENTS_MODELE.filter((s) => s.nature === "barricade de troncs").map((s) => {
  const a = auGue(s.x1, s.z1);
  const b = auGue(s.x2, s.z2);
  return { x: (a.x + b.x) / 2, z0: Math.min(a.z, b.z), z1: Math.max(a.z, b.z) };
});

/** Un point touche-t-il un obstacle fixe du gué (rayon compris) ? */
function heurteFixe(x: number, z: number, rayon: number): boolean {
  return OBSTACLES_FIXES.some((b) => Math.abs(x - b.x) < b.l / 2 + rayon && Math.abs(z - b.z) < b.p / 2 + rayon);
}

/** Le prochain point où aller de a vers b : le bout libre de la barricade qui barre la ligne droite, sinon b. */
export function passageGue(ax: number, az: number, bx: number, bz: number): { x: number; z: number } {
  for (const k of BARRICADES) {
    if ((ax - k.x) * (bx - k.x) >= 0) continue;
    const t = (k.x - ax) / (bx - ax);
    const z = az + (bz - az) * t;
    if (z < k.z0 - 0.45 || z > k.z1 + 0.45) continue;
    // Les deux bouts, un peu au-delà ; celui qui est libre et fait le moins long détour.
    const bouts = [{ x: k.x, z: k.z0 - 0.75 }, { x: k.x, z: k.z1 + 0.75 }].filter((p) => !heurteFixe(p.x, p.z, 0.32));
    if (bouts.length === 0) return { x: bx, z: bz };
    const detour = (p: { x: number; z: number }) => Math.hypot(p.x - ax, p.z - az) + Math.hypot(bx - p.x, bz - p.z);
    const bout = bouts.reduce((m, p) => (detour(p) < detour(m) ? p : m));
    // On vise un point juste de son côté de la barricade : il glisse le long des troncs sans buter sur leur bout.
    const cote = Math.sign(ax - k.x);
    const avant = { x: k.x + cote * 0.45, z: bout.z };
    // Arrivé au bout : on passe de l'autre côté, sans redescendre vers les troncs.
    if (Math.hypot(avant.x - ax, avant.z - az) < 0.3) return { x: k.x - cote * 0.6, z: bout.z };
    return avant;
  }
  return { x: bx, z: bz };
}

/** Le milieu des Éteints du gué : le plein air, sauf le chemin autour de la chicane. */
export const MILIEU_GUE = {
  son: () => 1,
  vue: () => true,
  obscur: () => false,
  passage: passageGue,
  cascade: false,
} as const;

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
  return SEGMENTS_MODELE.filter((s) => s.nature === "mur" && dans(s)).flatMap(boitesDuSegment);
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
