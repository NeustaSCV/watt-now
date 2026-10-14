// Où chaque lieu sème (plan 0.9, chantiers G et I : M5, M7) : les étendues de chaque lieu (la pelouse libre, sous les
// arbres, en lisière), le semis complet d'un lieu (son contenu d'avant, puis les lignes nouvelles de la table), et ce
// que le lieu vivant en sait (la tournée de chaque point, sa nouvelle place quand on le prend).
//
// Les quantités sont dans semis.ts (la table SEMIS). Les étendues d'avant (le bois en lisière de la station, le banc de
// galets du gué…) sont dans halte.ts et gue.ts, qui les tirent comme en 0.8 ; celles-ci s'y ajoutent.
//
// « Pelouse libre » : ni dans l'eau, ni dans un bâtiment, ni sur une route ou un chemin, ni sur un obstacle, ni au pied
// d'une sortie (on arrive libre). Chaque lieu le dit à partir de ce qu'on connaît déjà de lui (sa zone, ses pièces, les
// chemins de son modèle).

import { BATIMENT, BASCULE, BRECHE, FOSSE, PARC_VOLAILLES, PORTAIL, butinCoop, pieceDe } from "./cooperative.ts";
import { DEMI_ROUTE, ETENDUES_GUE, VN_MODELE, VS_MODELE, auGue, auModele, auSecGue, interpoler, semerGue, zRoute } from "./gue.ts";
import { ETENDUES_HALTE, semerHalte } from "./halte.ts";
import { FERME_HALTE, ROUTE, ZONE_COOP, ZONE_MOULIN, ZONE_STATION, dansBoite, sortiesDe, type Boite, type LieuJouable } from "./lieux.ts";
import { FOSSE_ROUET, butinMoulin, pieceMoulin } from "./moulin.ts";
import { SEMIS, placeLibre, vracDuSemis, type Etendue, type LieuSemis, type Semes, type SemisVivant } from "./semis.ts";
import { VRAC_MAX, aleatoire, type ButinLieu, type RessourceSol } from "./terrain.ts";

type Ressources = Omit<RessourceSol, "disponible">[];

/** Loin des sorties du lieu : 5 m de chaque arrivée, 2 m de chaque passage. */
function loinDesSorties(lieu: LieuJouable, x: number, z: number): boolean {
  return sortiesDe(lieu).every((s) => Math.hypot(s.arrivee.x - x, s.arrivee.z - z) > 5 && !dansBoite(x, z, s.boite, 2));
}

const dansUne = (x: number, z: number, boites: readonly Boite[], marge = 0) => boites.some((b) => dansBoite(x, z, b, marge));
const boite = (x0: number, x1: number, z0: number, z1: number): Boite => ({ x: (x0 + x1) / 2, z: (z0 + z1) / 2, l: x1 - x0, p: z1 - z0 });

// ---------- La station ----------

/** La cour de la station (le parking, l'auvent), la cour et le jardin de la ferme : pas de pelouse. */
const COURS_STATION: readonly Boite[] = [boite(84, 126, 12, 28), boite(FERME_HALTE.x - 10, FERME_HALTE.x + 22, 12, 27.5)];

function libreStation(x: number, z: number): boolean {
  return (
    x > ZONE_STATION.xMin + 1 &&
    x < ZONE_STATION.xMax - 1 &&
    Math.abs(z - ROUTE.z) > ROUTE.demiLargeur + 1.5 &&
    !dansUne(x, z, ZONE_STATION.obstacles, 1) &&
    !dansUne(x, z, COURS_STATION) &&
    loinDesSorties("station", x, z)
  );
}

const ETENDUES_STATION: Record<string, Etendue> = {
  ...ETENDUES_HALTE,
  // Les prés entre la lisière et la route, de part et d'autre.
  pelouse: { tirer: (a) => ({ x: 1.5 + a() * 197, z: a() < 0.5 ? 13.5 + a() * (ROUTE.z - ROUTE.demiLargeur - 15) : ROUTE.z + ROUTE.demiLargeur + 1.5 + a() * (54 - ROUTE.z - ROUTE.demiLargeur - 1.5) }), libre: libreStation },
  // Sous les grands arbres de la lisière, au nord et au sud (la forêt commence au bord de la halte).
  sous_arbres: { tirer: (a) => ({ x: 2 + a() * 196, z: a() < 0.5 ? 9.6 + a() * 3.2 : 55.4 + a() * 3.2 }), libre: libreStation },
  // Juste devant la lisière, là où poussent les ronciers.
  en_lisiere: { tirer: (a) => ({ x: 2 + a() * 196, z: a() < 0.5 ? 13.2 + a() * 3.3 : 51.3 + a() * 3.3 }), libre: libreStation },
};

// ---------- Le gué ----------

/**
 * Les emprises bâties et les lieux dégagés du modèle du gué (repère du modèle : x1, x2, z1, z2), copiées de `EMPRISES`
 * (client/src/batiments/halte-gue/modele.js, qui ne les exporte pas) : l'huilerie, l'épave, la cabane du passeur et la
 * cale, la guinguette, la tête de pont, le Kayak+, le lavoir, le camping-car, le garde-pêche, la barricade, le frêne au
 * drone. Et la berge de vase de la glaise (autourDeLaGlaise).
 */
const EMPRISES_GUE: readonly (readonly [number, number, number, number])[] = [
  [-81.5, -66.5, -25.5, -12.5],
  [-66.5, -60.5, 9.5, 14],
  [-28, -10, -31, -17],
  [-42, -8, 11, 32],
  [-17, 16, -6, 6],
  [15.5, 24, -20, -14.5],
  [23, 33, -31, -21.5],
  [15, 27, 11, 19],
  [69, 81, -20.5, -13.5],
  [86, 92, -8, -2],
  [63, 74, 1, 11],
  [13.5, 30, 17.6, 31],
];

function libreGue(x: number, z: number): boolean {
  const m = auModele(x, z);
  return auSecGue(x, z) && !EMPRISES_GUE.some(([x1, x2, z1, z2]) => m.x > x1 - 1 && m.x < x2 + 1 && m.z > z1 - 1 && m.z < z2 + 1) && loinDesSorties("gue", x, z);
}

/** Le fond de vallée, entre le pied des deux talus (x du modèle de −46 à 44). */
const fondDeVallee = (a: () => number) => {
  const xm = -46 + a() * 90;
  const n = interpoler(VN_MODELE, xm) + 1;
  const s = interpoler(VS_MODELE, xm) - 1;
  return auGue(xm, n + a() * Math.max(0, s - n));
};

const ETENDUES_DU_GUE: Record<string, Etendue> = {
  ...ETENDUES_GUE,
  // Les pierres des pistes (Q1, 0.8.2) restent sur leurs pistes de gravier quand elles reviennent, mais plus au bord de
  // la route (le tirage de la 0.8.2 pouvait y déborder : on ne le change pas, pour garder les points d'avant).
  pistes: { tirer: ETENDUES_GUE.pistes.tirer, libre: (x, z) => ETENDUES_GUE.pistes.libre(x, z) && Math.abs(z - zRoute(x)) > DEMI_ROUTE + 0.5 },
  pelouse: { tirer: fondDeVallee, libre: libreGue },
  // Sous les saules et les aulnes de la berge, ou au pied des frênes des talus.
  sous_arbres: { tirer: (a) => (a() < 0.5 ? ETENDUES_GUE.berges : ETENDUES_GUE.talus).tirer(a), libre: libreGue },
  // Au pied des talus, là où poussent les ronciers.
  en_lisiere: { tirer: (a) => ETENDUES_GUE.talus.tirer(a), libre: libreGue },
};

// ---------- Le Moulin ----------

/**
 * Les chemins et la cour du Moulin (repère du modèle, `chemin(...)` du modèle) : la cour en terre battue, le chemin de
 * l'étable, l'accès au pont, le chemin de l'autre rive, le chemin de halage sur la levée.
 */
const CHEMINS_MOULIN: readonly Boite[] = [boite(-21, 9.3, 1, 9), boite(-6, 5, 9, 15.4), boite(1, 15.6, 15.4, 18.6), boite(26.4, 32, 15.4, 18.6), boite(13.8, 16.2, -27, 8)];

function libreMoulin(x: number, z: number): boolean {
  const mx = x - 32;
  const mz = z - 27;
  const piece = pieceMoulin(x, z);
  return (
    (piece === "dehors" || piece === "jardin") &&
    // L'herbe : à l'ouest du bief, ou sur l'autre rive (la levée est au chemin de halage ; l'eau entre les deux).
    ((mx > -31 && mx < 8.8) || (mx > 25.6 && mx < 31)) &&
    mz > -26 &&
    mz < 26 &&
    !dansUne(mx, mz, CHEMINS_MOULIN, 1) &&
    !dansBoite(x, z, FOSSE_ROUET, 1.5) &&
    !dansUne(x, z, ZONE_MOULIN.obstacles, 0.6) &&
    loinDesSorties("moulin", x, z)
  );
}

const ETENDUES_MOULIN: Record<string, Etendue> = {
  // L'herbe du lot : surtout à l'ouest (le jardin, les abords du logis), un peu sur l'autre rive.
  pelouse: { tirer: (a) => (a() < 0.85 ? { x: 1 + a() * 40, z: 1 + a() * 52 } : { x: 57.6 + a() * 5.4, z: 1 + a() * 52 }), libre: libreMoulin },
};

// ---------- La Coopérative ----------

/** Le parking devant le portail : du gravier. */
const PARKING_COOP = boite(30, 56, 42, 58.5);

function libreCoop(x: number, z: number): boolean {
  return (
    pieceDe(x, z) === "dehors" &&
    !dansBoite(x, z, BATIMENT, 1) &&
    !dansUne(x, z, [PARKING_COOP, PARC_VOLAILLES, BASCULE, FOSSE], 1) &&
    Math.hypot(x - PORTAIL.x, z - PORTAIL.z) > 7 &&
    Math.hypot(x - BRECHE.x, z - BRECHE.z) > 4 &&
    !dansUne(x, z, ZONE_COOP.obstacles, 0.6) &&
    loinDesSorties("cooperative", x, z)
  );
}

const ETENDUES_COOP: Record<string, Etendue> = {
  // L'herbe pousse le long du grillage, sur 2 m.
  grillage: {
    tirer: (a) => {
      const t = a();
      const d = 1.2 + a() * 2;
      const cote = Math.floor(a() * 4);
      return [{ x: 1 + t * 78, z: d }, { x: 80 - d, z: 1 + t * 58 }, { x: 1 + t * 78, z: 60 - d }, { x: d, z: 1 + t * 58 }][cote]!;
    },
    libre: libreCoop,
  },
};

/** Les étendues de chaque lieu. */
export const ETENDUES: Record<LieuSemis, Readonly<Record<string, Etendue>>> = {
  station: ETENDUES_STATION,
  gue: ETENDUES_DU_GUE,
  moulin: ETENDUES_MOULIN,
  cooperative: ETENDUES_COOP,
};

// ---------- Le semis d'un lieu ----------

/** Le contenu d'avant de chaque lieu (le semis d'avant compris, pour la station et le gué). */
const AVANT: Record<LieuSemis, () => { ressources: Ressources; semes: Semes }> = {
  station: semerHalte,
  gue: semerGue,
  moulin: () => ({ ressources: butinMoulin(), semes: new Map() }),
  cooperative: () => ({ ressources: butinCoop(), semes: new Map() }),
};

/** Une graine par lieu, pour les lignes nouvelles (à part : elles ne changent pas les tirages d'avant). */
const GRAINES: Record<LieuSemis, number> = { station: 9091, gue: 9127, moulin: 9133, cooperative: 9151 };

const DEJA = new Map<string, { ressources: Ressources; semes: Semes }>();

/**
 * Tout le contenu d'un lieu : celui d'avant, puis les lignes nouvelles de la table (VRAC_MAX tournées pour un type en
 * vrac), tirées dans leurs étendues. Le même pour une même table (on le garde).
 */
export function semerLieu(lieu: LieuSemis): { ressources: Ressources; semes: Semes } {
  const cle = `${lieu}|${JSON.stringify(SEMIS[lieu])}`;
  const deja = DEJA.get(cle);
  if (deja) return deja;
  const { ressources, semes } = AVANT[lieu]();
  const alea = aleatoire(GRAINES[lieu]);
  const s = SEMIS[lieu];
  for (const [nom, ligne] of Object.entries(s.lignes)) {
    if (!ligne.nouvelle) continue;
    const tours = s.vrac[ligne.type] && !ligne.premiereTourneeSeule ? VRAC_MAX : 1;
    for (let tour = 0; tour < tours; tour++) {
      for (let i = 0; i < ligne.n; i++) {
        const p = placeLibre(ETENDUES[lieu][ligne.ou]!, alea, ressources, ligne.ecart);
        if (!p) continue;
        const id = ressources.length + 1;
        ressources.push({ id, type: ligne.type, ...p });
        semes.set(id, { ligne: nom, tour });
      }
    }
  }
  const r = { ressources, semes };
  DEJA.set(cle, r);
  return r;
}

/** Les ressources d'un lieu à sa première visite (la `ressources` d'une définition de lieu vivant). */
export function ressourcesSemees(lieu: LieuSemis): () => Ressources {
  return () => semerLieu(lieu).ressources.map((r) => ({ ...r }));
}

/** Le butin d'un lieu sans butin à lui (le Moulin, la Coopérative) : les délais et le vrac du semis. */
export function butinDuSemis(lieu: LieuSemis): ButinLieu {
  return { repousse: { ...SEMIS[lieu].repousse }, vrac: vracDuSemis(lieu) };
}

/** Ce que le lieu vivant sait du semis : la tournée de chaque point, et où revient un point pris (M5). */
export function semisVivant(lieu: LieuSemis): SemisVivant {
  return {
    tournee: (id) => semerLieu(lieu).semes.get(id)?.tour ?? 0,
    ailleurs: (r, alea, occupees) => {
      const seme = semerLieu(lieu).semes.get(r.id);
      const ligne = seme ? SEMIS[lieu].lignes[seme.ligne] : undefined;
      const e = ligne ? ETENDUES[lieu][ligne.ou] : undefined;
      if (!ligne?.ailleurs || !e) return null;
      return placeLibre(e, alea, [...occupees].filter((o) => o !== r), ligne.ecart);
    },
  };
}
