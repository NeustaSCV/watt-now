// H2A, la route du pont (plan 0.10, chantier H ; N2-54 à N2-61, S-05, S-06, S-19, S-20, complément K1) : une halte
// partagée, comme la station et le gué, sur la route A du niveau 2, entre le terrain et le Grand Hôtel des Flots. Ce
// fichier dit tout ce que le serveur et le client partagent :
//
// - le repère : le modèle (`batiment/halte-route-pont/`, copié dans client/src/batiments/) est posé tel quel, décalé
//   (x du jeu = x du modèle + 100 ; z du jeu = z du modèle + 35). Comme sur la carte (client/src/carte.ts : le terrain
//   au nord-ouest du pont, l'hôtel au sud-est) et comme le modèle le dit (ses panneaux, ses entrées), le terrain est à
//   l'ouest (le bourg) et l'hôtel à l'est (la rive des marins). En venant du terrain, on passe le bourg, puis la porte
//   du péage (la caisse est derrière, au pied du poste de guet : on paie contre la porte, la voix d'en haut entend), la
//   brèche, et la rive des marins. Les données du modèle viennent de `route-pont-modele.ts`
//   (scripts/extraire-route-pont.mjs) ;
// - la zone : les obstacles du modèle, et ce qui change d'état (S-02) : la porte du péage, fermée pour tous sauf pour qui
//   a payé (commun/src/peage.ts), et l'accès de la cale basse, fermé à marée haute (`zoneRoutePont`) ;
// - la marée (S-20) : deux états qui alternent toutes les 6 min réelles, la même heure pour tout le monde, calculée de
//   l'heure du monde comme la météo ; l'échelle peinte du quai la dit ; la cale basse (K1, y = − 0,5, traitée à plat) ne
//   se fouille qu'à marée basse, et qui y reste quand la mer monte est remis en haut de l'accès (`MAREE.retour`) ;
// - le contenu : le vrac « électrique et atelier » (I14), les matériaux de base des haltes (N2-06, le semis), la bobine
//   du moteur hors-bord et de la mobylette (N2-57), les fouilles (N2-58, N2-61), les bancs de la cale, les douze
//   Éteints placés par la fiche (S-06), dont les trois Noyés de la vase ;
// - la vue : les murs du modèle (la maison du pontier, le bar, le poste de guet, la chapelle, le hangar).
//
// Ce fichier n'importe des autres modules du jeu que des types de `lieux.ts` (qui l'importe pour sa zone et ses
// sorties), et ce qui ne remonte pas jusqu'à lui.

import { creerGrille, type GrilleObstacles } from "./grille.ts";
import type { Boite, Sortie, Zone } from "./lieux.ts";
import { declarerObstaclesBas } from "./murs.ts";
import { BANCS_DE_LA_CALE } from "./ressources-pont.ts";
import { placeLibre, type Etendue, type SemisLieu, type Semes, type SemisVivant } from "./semis.ts";
import { VRAC_MAX, aleatoire, type ButinLieu, type RessourceSol, type TypeRessource } from "./terrain.ts";
import { percer, type PlanVue, type PorteVue } from "./vue.ts";
import {
  CHICANE_FERMEE_PONT,
  CHICANE_OUVERTE_PONT,
  FOUILLE_PONT,
  MAREE_HAUTE_PONT,
  MAREE_PONT,
  SEGMENTS_PONT,
  type PointMaree,
} from "./route-pont-modele.ts";
import type { SegmentModele } from "./gue-modele.ts";

/** À augmenter quand le contenu de la halte change : la base le régénère alors. */
export const VERSION_ROUTE_PONT = 1;

// ---------- Le repère ----------

/** Le lot du modèle : 200 × 70 m (FICHE.lot), quatre tronçons de 50 × 70 m. */
export const ROUTE_PONT = { longueur: 200, largeur: 70 } as const;

const arrondi = (v: number) => Math.round(v * 100) / 100;

/** Un point du modèle dans le repère du jeu. */
export function auPont(xm: number, zm: number): { x: number; z: number } {
  return { x: arrondi(xm + 100), z: arrondi(zm + 35) };
}

/** Un point du jeu dans le repère du modèle. */
export function auModelePont(x: number, z: number): { x: number; z: number } {
  return { x: x - 100, z: z - 35 };
}

/** La route traverse la halte d'est en ouest, au milieu (le tablier du pont, z = 0 dans le modèle). */
const ROUTE_Z = ROUTE_PONT.largeur / 2;

const dansRect = (x: number, z: number, r: { x0: number; x1: number; z0: number; z1: number }, marge = 0) => x > r.x0 - marge && x < r.x1 + marge && z > r.z0 - marge && z < r.z1 + marge;
const dansBoite = (x: number, z: number, b: Boite, marge = 0) => Math.abs(x - b.x) <= b.l / 2 + marge && Math.abs(z - b.z) <= b.p / 2 + marge;

// ---------- La marée (S-20) ----------

export type EtatMaree = "basse" | "haute";

/** Chaque état dure 6 min réelles (6 h de jeu) : un cycle de 12 min, basse la moitié du temps (Q-0.10-7, S-20). */
export const DUREE_MAREE_MS = 6 * 60_000;

/**
 * La marée à cet instant : basse, puis haute, toutes les 6 min depuis le début du monde. Elle se calcule de l'heure du
 * monde, comme la météo : le serveur et tous les écrans la voient pareil.
 */
export function maree(instant: number, debutMonde: number): EtatMaree {
  return Math.floor(Math.max(0, instant - debutMonde) / DUREE_MAREE_MS) % 2 === 0 ? "basse" : "haute";
}

/** Dans combien de temps (ms) la marée change. */
export function avantChangement(instant: number, debutMonde: number): number {
  const t = Math.max(0, instant - debutMonde);
  return DUREE_MAREE_MS - (t % DUREE_MAREE_MS);
}

/** La cale basse (K1), dans le repère du jeu : pavée, envasée, 0,5 m sous le quai, traitée à plat. */
export const CALE = (() => {
  const c = MAREE_PONT.cale;
  const a = auPont(c.x1, c.z1);
  const b = auPont(c.x2, c.z2);
  return { x0: a.x, x1: b.x, z0: a.z, z1: b.z, y: c.y } as const;
})();

/** Le point de retour (K1) : en haut de l'accès, sur le quai, où l'on remet qui est resté sur la cale. */
export const RETOUR_MAREE = auPont(MAREE_PONT.retour.x, MAREE_PONT.retour.z);

/** L'échelle de marée émaillée, sur le mur du quai, sous le tablier. */
export const ECHELLE_MAREE = auPont(MAREE_PONT.echelle.x, MAREE_PONT.echelle.z);

/** Sur la cale basse (l'accès compris, jusqu'au bord du quai) ? */
export function surLaCale(x: number, z: number): boolean {
  return dansRect(x, z, CALE, 0.05);
}

/** Le message qui passe, après un fondu, quand la mer monte et qu'on est resté sur la cale (K1). */
export const LIGNE_MAREE_MONTE = "La mer monte : tu remontes sur le quai.";

/** Ce que dit l'échelle peinte du quai : le niveau de l'eau, et quand la mer change (en heures de jeu). */
export function texteEchelle(instant: number, debutMonde: number): string {
  const heures = Math.max(1, Math.round(avantChangement(instant, debutMonde) / 60_000));
  const dans = heures <= 1 ? "dans l'heure" : `dans ${heures} heures environ`;
  return maree(instant, debutMonde) === "basse"
    ? `Marée basse : l'eau est au trait de 0,5. La cale est découverte. La mer remontera ${dans}.`
    : `Marée haute : l'eau est au trait de 2,8. La cale est sous l'eau. La mer redescendra ${dans}.`;
}

// ---------- Le péage (S-19 ; la règle est dans commun/src/peage.ts) ----------

/** La caisse du péage, au pied du poste de guet (objet « caisse_peage »). */
export const CAISSE_PEAGE = (() => {
  const p = FOUILLE_PONT.find((f) => f.quoi?.startsWith("la caisse du péage"))!;
  return auPont(p.x, p.z);
})();

/** La porte du péage, dans la chicane (son milieu ; elle court selon z). */
export const PORTE_PEAGE = (() => {
  const s = CHICANE_FERMEE_PONT[0]!;
  const a = auPont(s.x1, s.z1);
  const b = auPont(s.x2, s.z2);
  return { x: a.x, z0: Math.min(a.z, b.z), z1: Math.max(a.z, b.z), z: (a.z + b.z) / 2 } as const;
})();

/** On touche la caisse à moins de ce nombre de mètres. */
export const PORTEE_CAISSE = 1.6;

/**
 * Où l'on peut payer : à la caisse, et contre la porte du péage, de l'un ou l'autre côté. En venant du terrain, la caisse
 * est derrière la porte (le modèle la pose au pied du poste de guet, sur la pile) : on paie contre la porte, sous le
 * panneau « DANS LA CAISSE ↓ », et la voix d'en haut répond. À proposer au porteur : la caisse devant la porte.
 */
export function prochePeage(x: number, z: number): boolean {
  if (Math.hypot(x - CAISSE_PEAGE.x, z - CAISSE_PEAGE.z) <= PORTEE_CAISSE) return true;
  return Math.abs(x - PORTE_PEAGE.x) <= 1.8 && z > PORTE_PEAGE.z0 - 0.6 && z < PORTE_PEAGE.z1 + 0.6;
}

// ---------- La zone : le modèle, et ce qui change d'état ----------

/** Les obstacles qui arrêtent un coup ou un objet lancé : les murs, les véhicules, les piles. Le reste est bas. */
const NATURES_HAUTES = new Set([
  "mur",
  "maisons du bourg",
  "cabane du poste de guet",
  "pied du pylône",
  "massif d'ancrage du câble",
  "poteau du portique",
  "armoire technique du portique",
  "borne de télépéage",
  "grue de quai",
  "chicane : voiture en travers",
  "voiture brûlée",
  "voiture abandonnée",
  "voiture de la voie nord",
  "camionnette de livraison",
  "bordé de la péniche",
  "tableau arrière de la péniche",
  "calvaire des marins",
  "porte du péage fermée",
]);

/** Un segment du modèle, en boîtes du jeu (les segments en biais : en morceaux de 0,5 m qui se recouvrent). */
function boitesDuSegment(s: SegmentModele): Boite[] {
  const ep = s.nature === "mur" ? 0.24 : 0.2;
  const a = auPont(s.x1, s.z1);
  const b = auPont(s.x2, s.z2);
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  if (Math.abs(dx) < 0.02 || Math.abs(dz) < 0.02) {
    const selonX = Math.abs(dx) >= Math.abs(dz);
    return [{ x: arrondi(a.x + dx / 2), z: arrondi(a.z + dz / 2), l: arrondi(selonX ? Math.abs(dx) : ep), p: arrondi(selonX ? ep : Math.abs(dz)) }];
  }
  const n = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.5));
  const boites: Boite[] = [];
  for (let i = 0; i < n; i++) {
    const cx = a.x + (dx * (i + 0.5)) / n;
    const cz = a.z + (dz * (i + 0.5)) / n;
    boites.push({ x: arrondi(cx), z: arrondi(cz), l: arrondi(Math.abs(dx) / n + ep), p: arrondi(Math.abs(dz) / n + ep) });
  }
  return boites;
}

/**
 * Là où l'on marche, dans le repère du modèle : les deux rives (le quai de pierre, et à l'est la forme de radoub et sa
 * péniche), le tablier (sauf la moitié sud qui pend dans la brèche ; les planches couvrent le trou de la voie nord), les
 * plateformes des quatre piles, la cale basse du quai sud-ouest, le ponton et la cabane du carrelet. Le reste est l'eau,
 * huit mètres plus bas : le modèle n'en ferme pas tous les bords (la pile est, la brèche), le jeu la ferme.
 */
export function solDuModele(xm: number, zm: number): boolean {
  if (xm <= -58 || xm >= 58) return true;
  if ((xm <= -50 || xm >= 50) && zm >= -20 && zm <= 14) return true;
  if (zm >= -5.62 && zm <= 5.62 && xm >= -50 && xm <= 50) return !(xm > -5 && xm < 15 && zm > -1.8);
  const ax = Math.abs(xm);
  if (ax >= 32.5 && ax <= 42.5 && Math.abs(zm) >= 5.62 && Math.abs(zm) <= 10.4) return true;
  const c = MAREE_PONT.cale;
  if (xm >= c.x1 && xm <= c.x2 && zm >= c.z1 && zm <= c.z2) return true;
  if (xm <= -50.75 && zm >= -27.6 && zm <= -26.4) return true;
  return xm >= -54.75 && xm <= -50.75 && zm >= -29 && zm <= -25;
}

/**
 * Le modèle ferme le bord du quai d'un seul segment (x = ± 50, de z − 20 à 14), y compris là où le tablier s'appuie sur
 * le quai : on y ouvre la tête du pont (la largeur du tablier), sinon on ne passerait pas d'une rive au pont.
 */
function teteDuPont(s: SegmentModele): SegmentModele[] {
  if (!s.nature.startsWith("bord du quai") || s.x1 !== s.x2 || Math.abs(s.x1) !== 50) return [s];
  const [z0, z1] = [Math.min(s.z1, s.z2), Math.max(s.z1, s.z2)];
  return [
    { ...s, z1: z0, z2: -5.62 },
    { ...s, z1: 5.62, z2: z1 },
  ].filter((m) => m.z2 - m.z1 > 0.01);
}

/** L'eau : des bandes de 0,5 m (repère du jeu) partout où l'on ne marche pas, entre les deux quais. */
function boitesDEau(): Boite[] {
  const boites: Boite[] = [];
  const pas = 0.25;
  for (let z = 0.25; z < ROUTE_PONT.largeur; z += 0.5) {
    let debut: number | null = null;
    const fermer = (x: number) => {
      if (debut === null) return;
      boites.push({ x: arrondi((debut + x) / 2), z: arrondi(z), l: arrondi(x - debut), p: 0.5 });
      debut = null;
    };
    for (let x = 41; x <= 159; x += pas) {
      const m = auModelePont(x + pas / 2, z);
      const eau = !solDuModele(m.x, m.z);
      if (eau && debut === null) debut = x;
      if (!eau) fermer(x);
    }
    fermer(159);
  }
  return boites;
}

/** Les obstacles fixes (tous les états à part) : hauts, puis bas (les bords, les garde-corps, l'eau). */
const OBSTACLES_FIXES: readonly Boite[] = (() => {
  const hautes: Boite[] = [];
  const basses: Boite[] = [];
  for (const s of SEGMENTS_PONT.flatMap(teteDuPont)) (NATURES_HAUTES.has(s.nature) ? hautes : basses).push(...boitesDuSegment(s));
  basses.push(...boitesDEau());
  declarerObstaclesBas(basses);
  return [...hautes, ...basses];
})();
const GRILLE_FIXE: GrilleObstacles = creerGrille(OBSTACLES_FIXES);

/** Les obstacles d'un état : la porte du péage (haute), l'accès de la cale fermé par l'eau (bas). */
const PORTE_FERMEE: readonly Boite[] = CHICANE_FERMEE_PONT.flatMap(boitesDuSegment);
const PORTE_OUVERTE: readonly Boite[] = CHICANE_OUVERTE_PONT.flatMap(boitesDuSegment);
const ACCES_NOYE: readonly Boite[] = MAREE_HAUTE_PONT.flatMap(boitesDuSegment);
declarerObstaclesBas([...PORTE_OUVERTE, ...ACCES_NOYE]);

const BORNES = { xMin: 0.5, xMax: ROUTE_PONT.longueur - 0.5, zMin: 0.5, zMax: ROUTE_PONT.largeur - 0.5 } as const;

/** Ce qui change la zone : la marée haute, la porte du péage ouverte (pour qui a payé). */
export interface EtatZonePont {
  haute: boolean;
  ouverte: boolean;
}

const zones = new Map<string, Zone>();

/** La zone de la route du pont pour cet état : les obstacles fixes, la porte (fermée ou ouverte), la cale. */
export function zoneRoutePont(etat: EtatZonePont): Zone {
  const cle = `${etat.haute ? 1 : 0}${etat.ouverte ? 1 : 0}`;
  const deja = zones.get(cle);
  if (deja) return deja;
  const mobiles = [...(etat.ouverte ? PORTE_OUVERTE : PORTE_FERMEE), ...(etat.haute ? ACCES_NOYE : [])];
  const ajout = creerGrille(mobiles, GRILLE_FIXE.taille);
  const cases = new Map(GRILLE_FIXE.cases);
  for (const [k, liste] of ajout.cases) cases.set(k, [...(cases.get(k) ?? []), ...liste]);
  const zone: Zone = { ...BORNES, obstacles: [...OBSTACLES_FIXES, ...mobiles], grille: { taille: GRILLE_FIXE.taille, cases } };
  zones.set(cle, zone);
  return zone;
}

/** La halte telle qu'on la trouve : la porte du péage fermée, la marée basse. `lieux.ts` en fait sa zone. */
export const ZONE_ROUTE_PONT: Zone = zoneRoutePont({ haute: false, ouverte: false });

// ---------- Les sorties ----------

/** Les deux bouts de la route du Littoral : le terrain à l'ouest (le bourg), l'hôtel à l'est (la rive des marins). */
export const SORTIES_ROUTE_PONT: Sortie[] = [
  {
    vers: "terrain",
    boite: { x: 2, z: ROUTE_Z, l: 4, p: 10 },
    arrivee: { x: 4.5, z: ROUTE_Z, o: Math.PI / 2 },
    libelle: "Rentrer chez toi",
  },
  {
    vers: "grand_hotel",
    boite: { x: ROUTE_PONT.longueur - 2, z: ROUTE_Z, l: 4, p: 10 },
    arrivee: { x: ROUTE_PONT.longueur - 4.5, z: ROUTE_Z, o: -Math.PI / 2 },
    libelle: "Continuer vers le Grand Hôtel",
  },
];

// ---------- Où l'on marche (pour poser le contenu) ----------

/** Un point (avec son rayon) touche-t-il un obstacle de la zone ? */
function heurteZone(zone: Zone, x: number, z: number, rayon: number): boolean {
  const g = zone.grille!;
  const liste = g.cases.get(Math.floor(x / g.taille) * 4096 + Math.floor(z / g.taille)) ?? [];
  return liste.some((b) => dansBoite(x, z, b, rayon));
}

/**
 * Les cases de 0,5 m où l'on peut marcher, depuis la route, porte du péage ouverte, à marée basse : la terre ferme,
 * le tablier, les quais (l'eau, huit mètres plus bas, est fermée par les bords du quai). Calculé une fois.
 */
const MARCHABLE: Uint8Array = (() => {
  const zone = zoneRoutePont({ haute: false, ouverte: true });
  const nx = ROUTE_PONT.longueur * 2;
  const nz = ROUTE_PONT.largeur * 2;
  const vu = new Uint8Array(nx * nz);
  const libre = (i: number, j: number) => i > 0 && j > 0 && i < nx - 1 && j < nz - 1 && !heurteZone(zone, i / 2 + 0.25, j / 2 + 0.25, 0.3);
  const pile: number[] = [];
  const depart = [Math.floor((ROUTE_PONT.longueur - 4.5) * 2), Math.floor(ROUTE_Z * 2)] as const;
  if (libre(depart[0], depart[1])) {
    vu[depart[0] * nz + depart[1]] = 1;
    pile.push(depart[0] * nz + depart[1]);
  }
  while (pile.length > 0) {
    const k = pile.pop()!;
    const i = Math.floor(k / nz);
    const j = k % nz;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const a = i + di;
      const b = j + dj;
      const kk = a * nz + b;
      if (vu[kk] || !libre(a, b)) continue;
      vu[kk] = 1;
      pile.push(kk);
    }
  }
  return vu;
})();

/** Peut-on marcher là (on y arrive depuis la route) ? */
export function marchable(x: number, z: number): boolean {
  const i = Math.floor(x * 2);
  const j = Math.floor(z * 2);
  if (i < 0 || j < 0 || i >= ROUTE_PONT.longueur * 2 || j >= ROUTE_PONT.largeur * 2) return false;
  return MARCHABLE[i * ROUTE_PONT.largeur * 2 + j] === 1;
}

// ---------- La vue : les murs du modèle ----------

/** Les pièces où l'on entre (repère du modèle) ; le reste est à ciel ouvert. */
const PIECES_MODELE = {
  pontier: { x0: -77, x1: -66, z0: -15, z1: -6.6 },
  bar: { x0: -92, x1: -80, z0: 6.5, z1: 15.5 },
  poste: { x0: -35.9, x1: -32.9, z0: 8.2, z1: 10.3 },
  chapelle: { x0: 63, x1: 71, z0: -22, z1: -9.6 },
  hangar: { x0: 81, x1: 95, z0: 14, z1: 29 },
} as const;
type PiecePont = keyof typeof PIECES_MODELE;

const PIECES_JEU = Object.fromEntries(
  Object.entries(PIECES_MODELE).map(([id, r]) => {
    const a = auPont(r.x0, r.z0);
    const b = auPont(r.x1, r.z1);
    return [id, { x0: a.x, x1: b.x, z0: a.z, z1: b.z }];
  }),
) as Record<PiecePont, { x0: number; x1: number; z0: number; z1: number }>;

/** La pièce d'un point (« dehors » par défaut). */
export function piecePont(x: number, z: number): string {
  for (const [id, r] of Object.entries(PIECES_JEU)) if (dansRect(x, z, r)) return id;
  return "dehors";
}

/**
 * Le plan de vue : les murs du modèle (plus hauts qu'un homme) ; les portes et les fenêtres sont les trous qu'il y a
 * laissés. Les portes des cinq bâtiments où l'on entre, toujours ouvertes (des battants arrachés ou sans serrure).
 */
export const PLAN_ROUTE_PONT: PlanVue = (() => {
  const porte = (id: PiecePont, xm: number, zm: number, largeur: number, sens: "x" | "z"): PorteVue => ({ id, ...auPont(xm, zm), largeur, sens, entre: ["dehors", id], toujoursOuverte: true });
  const portes: PorteVue[] = [
    porte("pontier", -74.05, -6.6, 1.18, "x"),
    porte("bar", -86, 6.5, 1.6, "x"),
    { ...porte("bar", -80, 9.05, 1.17, "z"), id: "bar_terrasse" },
    porte("poste", -34.77, 8.2, 1.5, "x"),
    porte("chapelle", 67, -9.6, 1.6, "x"),
    porte("hangar", 81, 21.5, 4.74, "z"),
    { ...porte("hangar", 88, 29, 1.2, "x"), id: "hangar_service" },
  ];
  const murs = SEGMENTS_PONT.filter((s) => s.nature === "mur" || s.nature === "maisons du bourg" || s.nature === "cabane du poste de guet").flatMap(boitesDuSegment);
  return {
    murs: percer(murs, []),
    portes,
    fenetres: [],
    pieceDe: piecePont,
    pieces: ["dehors", ...Object.keys(PIECES_MODELE)],
  };
})();

// ---------- Le contenu (I14, N2-06, N2-57, N2-58, N2-61) ----------

/** Un point de la fiche du modèle, par le début de sa description (il suit le modèle s'il bouge). */
function pointFiche(debut: string, rang = 0): PointMaree {
  const p = FOUILLE_PONT.filter((f) => f.quoi?.startsWith(debut))[rang];
  if (!p) throw new Error(`route du pont : pas de point « ${debut} » (${rang}) dans la fiche du modèle`);
  return p;
}

/** Les points à place fixe : les fouilles, la bobine, les bancs de la cale (leurs points de la fiche). */
const PLACES_FIXES: readonly [TypeRessource, string, number][] = [
  ["pont_pontier", "bureau du pontier", 0],
  ["pont_epicerie", "rayons de l'épicerie", 0],
  ["pont_bar", "comptoir du bar", 0],
  ["pont_voiture", "voiture de la chicane : coffre", 0],
  ["pont_voiture", "voiture aux portes ouvertes", 0],
  ["pont_voiture", "voiture de la voie nord", 0],
  ["pont_camionnette", "camionnette de livraison", 0],
  ["pont_peniche", "péniche : salon", 0],
  ["pont_hangar", "hangar : barques", 0],
  ["pont_chapelle", "chapelle : cierges", 0],
  ["pont_moteur", "établi du hangar", 0],
  ["banc_debroussailleuse", "à marée basse : débroussailleuse", 0],
  ["banc_caddie", "à marée basse : caddie", 0],
  ["banc_caddie", "à marée basse : caddie", 1],
  ["banc_trottinette", "à marée basse : trottinette", 0],
  ["banc_trottinette", "à marée basse : trottinette", 1],
  ["banc_mobylette", "à marée basse : la mobylette", 0],
];

/**
 * Le vrac « électrique et atelier » (I14 : cuivre ≈ 10, résistances ≈ 3, cellules ≈ 9, lames de ressort ≈ 8, barres ≈ 4,
 * l'huile), par tournée, près de ce qui le donne (repère du modèle) : l'armoire technique du portique « connecté », la
 * borne « Pont Express », le colis du drone, la bouée connectée, la ferraille au pied de la grue, la voiture brûlée, le
 * treuil de la cale, le bidon d'huile du hangar. Un point de cuivre donne 2 fils, un bloc de cellules 3 cellules, un
 * ressort 2 lames.
 */
const VRAC_PONT: readonly { type: TypeRessource; places: readonly (readonly [number, number])[] }[] = [
  { type: "pont_cuivre", places: [[-60.2, -5.4], [-60.2, -5.4], [-54.4, 10.6], [27.2, 4.4], [62, 9.5]] },
  { type: "pont_resistances", places: [[-60.2, -5.4], [-60.2, -5.4], [-65.8, -4.6]] },
  { type: "pont_cellules", places: [[27.2, 4.4], [-65.8, -4.6], [62, 9.5]] },
  { type: "ressort", places: [[-52.8, 8.7], [-52.8, 8.7], [-19, 1.9], [-19, 1.9]] },
  { type: "barre_metal", places: [[-52.8, 8.7], [-52.8, 8.7], [-19, 1.9], [79.6, 23]] },
  { type: "pont_huile", places: [[94.25, 27.1]] },
];

/** Les arrivées des deux sorties : on n'y pose rien (on arrive libre). */
function loinDesSorties(x: number, z: number): boolean {
  return SORTIES_ROUTE_PONT.every((s) => Math.hypot(s.arrivee.x - x, s.arrivee.z - z) > 5 && !dansBoite(x, z, s.boite, 2));
}

/** Les bâtiments (les couches du modèle) : on ne sème rien dedans. */
const BATIMENTS: readonly { x0: number; x1: number; z0: number; z1: number }[] = [
  ...Object.values(PIECES_JEU),
  (() => {
    const a = auPont(-99.6, 23.5);
    const b = auPont(-80.6, 33.5);
    return { x0: a.x, x1: b.x, z0: a.z, z1: b.z };
  })(),
];

/** Libre pour une ressource : on y marche, hors de la cale, des bâtiments, de la route, des sorties, loin des obstacles. */
export function librePont(x: number, z: number, marge = 0.45): boolean {
  return (
    marchable(x, z) &&
    !surLaCale(x, z) &&
    !BATIMENTS.some((r) => dansRect(x, z, r, 0.6)) &&
    loinDesSorties(x, z) &&
    !heurteZone(ZONE_ROUTE_PONT, x, z, marge) &&
    Math.hypot(x - CAISSE_PEAGE.x, z - CAISSE_PEAGE.z) > 2.5 &&
    Math.abs(x - PORTE_PEAGE.x) > 2
  );
}

/** Une place libre près d'un point du modèle, sur des cercles de plus en plus grands (déterministe). */
function pres(xm: number, zm: number, rang: number, prises: readonly { x: number; z: number }[]): { x: number; z: number } {
  const c = auPont(xm, zm);
  for (let k = 0; k < 400; k++) {
    const r = 0.9 + 0.35 * Math.floor((k + rang * 5) / 8);
    const a = (k + rang * 3) * 2.399;
    const p = { x: arrondi(c.x + Math.cos(a) * r), z: arrondi(c.z + Math.sin(a) * r) };
    if (librePont(p.x, p.z) && prises.every((q) => Math.hypot(q.x - p.x, q.z - p.z) > 0.9)) return p;
  }
  return c;
}

/**
 * Les étendues du semis (semis-lieux.ts) : les pierres des parapets éboulés et des quais, le bois flotté des dunes à
 * oyats, de vieux pieux sur les quais (repère du jeu).
 */
export const ETENDUES_ROUTE_PONT: Readonly<Record<string, Etendue>> = (() => {
  const autour = (pts: readonly (readonly [number, number])[], r: number) => (a: () => number) => {
    const [xm, zm] = pts[Math.floor(a() * pts.length) % pts.length]!;
    const angle = a() * Math.PI * 2;
    const d = Math.sqrt(a()) * r;
    return auPont(xm + Math.cos(angle) * d, zm + Math.sin(angle) * d);
  };
  const rect = (rs: readonly (readonly [number, number, number, number])[]) => (a: () => number) => {
    const [x0, x1, z0, z1] = rs[Math.floor(a() * rs.length) % rs.length]!;
    return auPont(x0 + a() * (x1 - x0), z0 + a() * (z1 - z0));
  };
  const libre = (x: number, z: number) => librePont(x, z, 0.6) && Math.abs(z - ROUTE_Z) > 4.5;
  return {
    // Les pierres des deux parapets de quai éboulés (les points de la fiche).
    parapets: { tirer: autour([[-63.6, 31.4], [61.5, 31.4]], 4), libre },
    // Les quais de pierre, des deux rives, hors de la route.
    quais: { tirer: rect([[-74, -60, 14, 34], [-98, -60, -20, -7], [60, 80, -8, 12], [82, 98, 30, 34]]), libre },
    // Les dunes à oyats, derrière les ganivelles : le bois flotté.
    dunes: { tirer: rect([[-99, -64, -34, -16], [74, 99, -34, -12]]), libre },
  };
})();

/**
 * Le semis des matériaux de base (N2-06 : les haltes gardent pierres, bûches, branches), au format de la table SEMIS
 * (commun/src/semis.ts), mais tenu ici : la route du pont sème elle-même, comme le gué en 0.8. L'estuaire a peu de
 * bois : des pierres des parapets éboulés et des quais, du bois flotté dans les dunes, de vieux pieux sur les quais.
 * **Proposition du chantier H, à valider par le porteur.** Une quantité changée demande VERSION_ROUTE_PONT + 1.
 */
export const SEMIS_ROUTE_PONT: SemisLieu = {
  vrac: { pierre: true, branche: true, buche: true },
  repousse: { pierre: 30 * 60_000, branche: 30 * 60_000, buche: 30 * 60_000 },
  lignes: {
    pierres_parapets: { type: "pierre", n: 6, ou: "parapets", ecart: 0.8, ailleurs: true },
    pierres_quais: { type: "pierre", n: 4, ou: "quais", ecart: 2, ailleurs: true },
    branches_dunes: { type: "branche", n: 8, ou: "dunes", ecart: 2, ailleurs: true },
    buches_quais: { type: "buche", n: 4, ou: "quais", ecart: 2.5, ailleurs: true },
  },
};

/** Les types du vrac et combien sont en jeu pour un voyageur seul (B8) : le semis, puis le vrac « électrique et atelier ». */
function vracDeBase(): Partial<Record<TypeRessource, number>> {
  const vrac: Partial<Record<TypeRessource, number>> = {};
  for (const l of Object.values(SEMIS_ROUTE_PONT.lignes)) vrac[l.type] = (vrac[l.type] ?? 0) + l.n;
  for (const v of VRAC_PONT) vrac[v.type] = (vrac[v.type] ?? 0) + v.places.length;
  return vrac;
}

/** Le butin de la halte : tout le vrac revient en 30 min et grandit avec les voyageurs (B4, B8). */
export const BUTIN_ROUTE_PONT: ButinLieu = {
  repousse: { ...SEMIS_ROUTE_PONT.repousse, pont_cuivre: 30 * 60_000, pont_resistances: 30 * 60_000, pont_cellules: 30 * 60_000, pont_huile: 30 * 60_000, ressort: 30 * 60_000, barre_metal: 30 * 60_000 },
  vrac: vracDeBase(),
};

let semeDeja: { ressources: Omit<RessourceSol, "disponible">[]; semes: Semes } | null = null;

/**
 * Tout le contenu de la halte, le même pour tous : les points à place fixe ; le vrac « électrique et atelier » par
 * tournée, près de ce qui le donne ; puis les lignes du semis, tirées dans leurs étendues (VRAC_MAX tournées : seule
 * la première est en jeu pour un voyageur seul).
 */
export function semerRoutePont(): { ressources: Omit<RessourceSol, "disponible">[]; semes: Semes } {
  if (semeDeja) return semeDeja;
  const ressources: Omit<RessourceSol, "disponible">[] = [];
  const semes: Semes = new Map();
  const poser = (type: TypeRessource, p: { x: number; z: number }, ligne?: string, tour = 0) => {
    const id = ressources.length + 1;
    ressources.push({ id, type, x: arrondi(p.x), z: arrondi(p.z) });
    if (ligne) semes.set(id, { ligne, tour });
  };
  for (const [type, debut, rang] of PLACES_FIXES) {
    const p = pointFiche(debut, rang);
    poser(type, auPont(p.x, p.z));
  }
  for (let tour = 0; tour < VRAC_MAX; tour++) {
    for (const v of VRAC_PONT) v.places.forEach(([xm, zm], i) => poser(v.type, pres(xm, zm, tour * 4 + i, ressources), `vrac_${v.type}`, tour));
  }
  const alea = aleatoire(9173);
  for (let tour = 0; tour < VRAC_MAX; tour++) {
    for (const [nom, ligne] of Object.entries(SEMIS_ROUTE_PONT.lignes)) {
      for (let i = 0; i < ligne.n; i++) {
        const p = placeLibre(ETENDUES_ROUTE_PONT[ligne.ou]!, alea, ressources, ligne.ecart);
        if (p) poser(ligne.type, p, nom, tour);
      }
    }
  }
  semeDeja = { ressources, semes };
  return semeDeja;
}

/** Les ressources de la halte à sa première visite (une copie). */
export function ressourcesRoutePont(): Omit<RessourceSol, "disponible">[] {
  return semerRoutePont().ressources.map((r) => ({ ...r }));
}

/** Ce que le lieu vivant sait du semis : la tournée de chaque point, et où revient un point du semis qu'on prend (M5). */
export const SEMIS_VIVANT_ROUTE_PONT: SemisVivant = {
  tournee: (id) => semerRoutePont().semes.get(id)?.tour ?? 0,
  ailleurs: (r, alea, occupees) => {
    const seme = semerRoutePont().semes.get(r.id);
    const ligne = seme ? SEMIS_ROUTE_PONT.lignes[seme.ligne] : undefined;
    if (!ligne?.ailleurs) return null;
    return placeLibre(ETENDUES_ROUTE_PONT[ligne.ou]!, alea, [...occupees].filter((o) => o !== r), ligne.ecart);
  },
};

/** Un banc de la cale : il ne se fouille qu'à marée basse. */
export function estBancDeLaCale(type: TypeRessource): boolean {
  return (BANCS_DE_LA_CALE as readonly TypeRessource[]).includes(type);
}

/** Ce qu'on dit à qui veut fouiller un banc à marée haute. */
export const LIGNE_BANC_SOUS_L_EAU = "La mer couvre la cale : il faudra attendre la marée basse.";
