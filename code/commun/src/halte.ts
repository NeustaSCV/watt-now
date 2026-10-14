// Le contenu de la halte de la station-service (Book 21 §3.2) : quelques vestiges modestes près de la station,
// des épaves sur la route, une grange effondrée à l'écart, du bois mort et des pierres en lisière.
// Un seul jeu de ressources, partagé par tous les voyageurs (Book 01 §2 bis).

import { FERME_HALTE, GARAGE, GOULET, ROUTE, STATION, ZONE_STATION, dansBoite } from "./lieux.ts";
import { nouvelEteint, type Eteint } from "./eteints.ts";
import { REGLAGES } from "./reglages.ts";
import { SEMIS, vracDuSemis, type Etendue, type Semes } from "./semis.ts";
import { VRAC_MAX, aleatoire, type ButinLieu, type RessourceSol, type TypeRessource } from "./terrain.ts";

/** À augmenter quand le contenu de la halte change : la base le régénère alors. */
export const VERSION_HALTE = 6;


/**
 * Le butin de la halte (plan 0.8, chantier 10 ; le moteur : serveur/src/lieu-vivant.ts). Les bûches et les pierres
 * reviennent en 30 min (B2, B4), alors qu'au terrain elles ne reviennent jamais (B1).
 */
export const BUTIN_HALTE: ButinLieu = {
  repousse: {
    // Les délais du semis (plan 0.9, semis.ts : bûches et pierres en 30 min).
    ...SEMIS.station.repousse,
    // Plan 0.8.2 (chantier D) : le retour du tas de bois est un réglage à chaud (6 h par défaut, B3), lu à chaque prise.
    get tas_bois() {
      return REGLAGES.tas_bois_retour_h * 3_600_000;
    },
  },
  // B2, B4, B8 : 12 bûches et 13 pierres pour un voyageur seul ; jusqu'à trois fois plus quand ils sont nombreux. Les
  // nombres sont dans la table du semis (plan 0.9, semis.ts).
  vrac: vracDuSemis("station"),
  personnel: {
    // R4 : la pièce de famille, chacune la sienne (24 h, Q-0.8-14).
    panneau_auvent: 1,
    piece_enclume: 1,
    piece_alternateur: 1,
    // Plan 0.8.2 (chantier D, recette de la 0.8) : la caisse de l'atelier aussi (clous, fil de fer, huile), à chacun la
    // sienne, qui revient pour lui en 12 h (REPOUSSE_MS) : le deuxième voyageur ne la trouve plus vide.
    caisse_atelier: 1,
    // Le tas de bois, 10 bûches à chacun (B3) : un réglage à chaud, lu à chaque visite.
    get tas_bois() {
      return REGLAGES.tas_bois_buches;
    },
  },
};

export function genererHalte(): Omit<RessourceSol, "disponible">[] {
  return semerHalte().ressources;
}

/** Ce qui est libre pour le semis d'avant (0.8) : hors de la route, des obstacles et de la cour de la station. */
function libreHalte(x: number, z: number): boolean {
  return Math.abs(z - ROUTE.z) > ROUTE.demiLargeur + 1 && !ZONE_STATION.obstacles.some((b) => dansBoite(x, z, b, 1)) && !dansBoite(x, z, { x: STATION.auvent.x, z: 20, l: 36, p: 16 });
}

/**
 * Les étendues du semis d'avant (plan 0.9 : un point pris y revient ailleurs) : le bois mort en lisière, les pierres
 * vers le goulet et la ferme, les buissons sur les bords. Les tirages sont ceux de la 0.8 (même ordre, même graine).
 */
export const ETENDUES_HALTE: Readonly<Record<"lisiere" | "goulet" | "ferme" | "bords", Etendue>> = {
  lisiere: { tirer: (a) => ({ x: 6 + a() * 188, z: a() < 0.5 ? 10 + a() * 4 : 54.5 + a() * 4 }), libre: libreHalte },
  goulet: { tirer: (a) => ({ x: GOULET.x - 10 + a() * 20, z: 12 + a() * 46 }), libre: libreHalte },
  ferme: { tirer: (a) => ({ x: FERME_HALTE.x - 8 + a() * 16, z: 12 + a() * 14 }), libre: libreHalte },
  bords: { tirer: (a) => ({ x: 20 + a() * 160, z: a() < 0.5 ? 15 + a() * 8 : 48 + a() * 7 }), libre: libreHalte },
};

/** Le contenu de la halte, et la ligne du semis de chaque point semé (plan 0.9 : semis.ts). */
export function semerHalte(): { ressources: Omit<RessourceSol, "disponible">[]; semes: Semes } {
  const fixes: [TypeRessource, number, number][] = [
    ["rayonnage", STATION.boutique.x - 3, 18.3],
    // L'autre est à l'intérieur, au fond de la boutique : il faut entrer (et passer devant le Dormant).
    ["rayonnage", 107.4, 12.5],
    // Le petit panneau solaire, descendu de l'auvent et appuyé contre son pilier est (2026-10-08 : au sol, c'est clair).
    ["panneau_auvent", STATION.auvent.x + 9.6, STATION.auvent.z + 0.9],
    ["caisse_atelier", STATION.atelier.x, 18.1],
    // La pièce de famille (plan 0.8, chantier 10) : chacun voit la sienne (FAMILLE_DE_RESSOURCE) et la prend pour lui.
    ["piece_enclume", GARAGE.etabliBois.x, GARAGE.etabliBois.z + 0.3],
    ["piece_alternateur", GARAGE.etabliVoiture.x - 0.3, GARAGE.etabliVoiture.z + 0.2],
    // Le bois de chauffage derrière l'atelier : 10 bûches à chacun (B3).
    ["tas_bois", GARAGE.tasBois.x, GARAGE.tasBois.z - 0.35],
    ["epave_voiture", 63, 33.2],
    ["epave_voiture", 139, 37],
    ["epave_camion", 170, 22],
    ["grenier", FERME_HALTE.x + 2, FERME_HALTE.z],
  ];
  const ressources: Omit<RessourceSol, "disponible">[] = fixes.map(([type, x, z], i) => ({ id: i + 1, type, x, z }));
  const semes: Semes = new Map();

  // Ressources naturelles : bois mort en lisière, pierres vers le goulet et la ferme, quelques buissons. Les nombres sont
  // ceux de la table du semis (semis.ts) ; 40 essais, puis le dernier tirage (comme en 0.8 : les points d'avant restent).
  const aleat = aleatoire(2027);
  const L = SEMIS.station.lignes;
  const placer = (nom: keyof typeof L, tour = 0) => {
    const ligne = L[nom]!;
    const e = ETENDUES_HALTE[ligne.ou as keyof typeof ETENDUES_HALTE];
    const libre = (p: { x: number; z: number }) => e.libre(p.x, p.z) && ressources.every((r) => Math.hypot(r.x - p.x, r.z - p.z) > ligne.ecart);
    for (let i = 0; i < ligne.n; i++) {
      let p = e.tirer(aleat);
      for (let essai = 0; essai < 40 && !libre(p); essai++) p = e.tirer(aleat);
      const id = ressources.length + 1;
      ressources.push({ id, type: ligne.type, x: Math.round(p.x * 100) / 100, z: Math.round(p.z * 100) / 100 });
      semes.set(id, { ligne: nom, tour });
    }
  };
  placer("branches_lisiere");
  // Le vrac (B8) : VRAC_MAX tournées, dont seule la première est en jeu pour un voyageur seul (BUTIN_HALTE.vrac).
  for (let tour = 0; tour < VRAC_MAX; tour++) {
    placer("buches_lisiere", tour);
    placer("pierres_goulet", tour);
    placer("pierres_ferme", tour);
  }
  placer("buissons");
  return { ressources, semes };
}

/**
 * Les Éteints de la halte (Book 01 §2 bis : dispersés, plus nombreux près du butin).
 * Des dormants devant la boutique, dans la grange, contre le camion ; quelques errants sur les bas-côtés.
 */
export function eteintsHalte(): Eteint[] {
  const places: [number, number, "dormant" | "errant", number][] = [
    // Le Dormant de la boutique, affalé derrière le comptoir de caisse (moment-vitrine n° 4).
    [100.4, 12.6, "dormant", 0.3],
    [STATION.boutique.x - 5.5, 19.2, "dormant", -0.8],
    // Plan 0.8.2 (chantier D) : couché à 0,85 m de l'établi de l'enclume, il gênait la pièce de famille ; il dort
    // désormais contre le flanc est de la voiture éventrée, hors du chemin des deux établis (à plus de 6 m de chacun).
    [GARAGE.voitureEventree.x + 4, GARAGE.voitureEventree.z + 0.3, "dormant", -1.6],
    [FERME_HALTE.x - 2.5, FERME_HALTE.z - 1, "dormant", 1.2],
    [FERME_HALTE.x + 3.5, FERME_HALTE.z + 1.5, "dormant", -2],
    [166.5, 25, "dormant", 0.2],
    [61, 30.6, "dormant", 1.9],
    [30, 41, "errant", 0],
    [82, 44.5, "errant", 2],
    [128, 27.5, "errant", -1],
    [184, 44, "errant", 3],
  ];
  return places.map(([x, z, etat, o], i) => nouvelEteint(i + 1, x, z, etat, o));
}
